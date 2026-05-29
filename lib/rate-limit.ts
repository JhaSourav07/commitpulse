import { TTLCache } from './cache';

/**
 * In-memory rate limiter to prevent basic DoS/spam (Denial of Wallet).
 *
 * Note: In a serverless environment, this resets per cold-start/instance,
 * but it is highly effective at stopping aggressive single-instance spikes.
 * For multi-instance strict syncing, a Redis store (Vercel KV/Upstash) should be used.
 */
export class RateLimiter {
  private cache: TTLCache<number>;
  private limit: number;
  private windowMs: number;

  /**
   * Creates a new RateLimiter instance.
   *
   * @param limit - Maximum number of requests allowed per window. Defaults to 5.
   * @param windowMs - Time window in milliseconds. Defaults to 60000 (1 minute).
   */
  constructor(limit = 5, windowMs = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.cache = new TTLCache<number>(10000, windowMs);
  }

  /**
   * Checks whether a request from the given IP is allowed.
   *
   * Increments the request count for the IP and resets the TTL on each call,
   * behaving similarly to a sliding window timeout.
   *
   * @param ip - The IP address to check.
   * @returns `true` if the request is allowed, `false` if rate limited.
   *
   * @example
   * if (!rateLimiter.check(ip)) {
   *   return new Response("Too Many Requests", { status: 429 });
   * }
   */
  check(ip: string): boolean {
    const current = this.cache.get(ip) || 0;
    if (current >= this.limit) {
      return false;
    }
    this.cache.set(ip, current + 1, this.windowMs);
    return true;
  }
  /**
   * Resets the request count for a given IP address.
   *
   * Useful for clearing rate limit state after a successful
   * authentication or admin action.
   *
   * @param ip - The IP address to reset.
   *
   * @example
   * rateLimiter.reset("192.168.1.1");
   */
  reset(ip: string): void {
    this.cache.delete(ip);
  }
}

// Global instance for track-user endpoint (5 requests per IP per minute)
export const trackUserRateLimiter = new RateLimiter(5, 60000);

/**
 * Lightweight in-memory rate limiter for Next.js Edge Middleware.
 *
 * Note: In a distributed edge environment, this is per-instance.
 * For global rate limiting, a distributed store like Redis would be required.
 */

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const trackers = new TTLCache<{ count: number }>(2000, 60000);

/**
 * Checks if a request from a given IP should be rate limited.
 *
 * @param ip - The IP address to track.
 * @param limit - Maximum number of requests allowed in the window. Defaults to 60.
 * @param windowMs - Time window in milliseconds. Defaults to 60000 (1 minute).
 * @returns A {@link RateLimitResult} containing success status, limit, remaining count, and reset time.
 *
 * @example
 * const result = rateLimit(ip);
 * if (!result.success) {
 *   return new Response("Too Many Requests", { status: 429 });
 * }
 */
export function rateLimit(
  ip: string,
  limit: number = 60,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const tracker = trackers.get(ip);

  if (!tracker) {
    trackers.set(ip, { count: 1 }, windowMs);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    };
  }

  tracker.count++;
  trackers.set(ip, tracker, windowMs);

  if (tracker.count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: now + windowMs,
    };
  }

  return {
    success: true,
    limit,
    remaining: limit - tracker.count,
    reset: now + windowMs,
  };
}
