import { DistributedCache } from './cache';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * In-memory rate limiter to prevent basic DoS/spam (Denial of Wallet).
 *
 * Note: In a serverless environment, this resets per cold-start/instance,
 * but it is highly effective at stopping aggressive single-instance spikes.
 * For multi-instance strict syncing, a Redis store (Vercel KV/Upstash) should be used.
 */
export class RateLimiter {
  private cache: DistributedCache<number>;
  private limit: number;
  private windowMs: number;
  private allowlist = new Set<string>();
  private blocklist = new Set<string>();

  /**
   * Creates a new RateLimiter instance.
   *
   * @param limit - Maximum number of requests allowed per window. Defaults to 5.
   * @param windowMs - Time window in milliseconds. Defaults to 60000 (1 minute).
   */
  constructor(limit = 5, windowMs = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.cache = new DistributedCache<number>(10000, windowMs);
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
  async check(ip: string): Promise<boolean> {
    if (this.allowlist.has(ip)) return true;
    if (this.blocklist.has(ip)) return false;
    const current = (await this.cache.get(ip)) ?? 0;
    if (current >= this.limit) return false;
    if (current === 0) {
      await this.cache.set(ip, 1, this.windowMs);
    } else {
      await this.cache.update(ip, current + 1);
    }
    return true;
  }
  async checkWithResult(ip: string): Promise<RateLimitResult> {
    if (this.allowlist.has(ip))
      return {
        success: true,
        limit: this.limit,
        remaining: this.limit,
        reset: Date.now() + this.windowMs,
      };
    if (this.blocklist.has(ip))
      return { success: false, limit: this.limit, remaining: 0, reset: Date.now() + this.windowMs };
    const now = Date.now();
    const current = (await this.cache.get(ip)) ?? 0;

    if (current >= this.limit) {
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: now + this.windowMs,
      };
    }

    if (current === 0) {
      await this.cache.set(ip, 1, this.windowMs);
    } else {
      await this.cache.update(ip, current + 1);
    }
    return {
      success: true,
      limit: this.limit,
      remaining: this.limit - (current + 1),
      reset: now + this.windowMs,
    };
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
  async reset(ip: string): Promise<void> {
    await this.cache.delete(ip);
  }
  /**
   * Returns the number of remaining requests allowed for a given IP
   * in the current window.
   *
   * Does not consume a request — use `check()` for that.
   *
   * @param ip - The IP address to check.
   * @returns Promise resolving to the number of remaining requests,
   *          or the full limit if the IP has no recorded requests.
   *
   * @example
   * const left = await rateLimiter.remaining("192.168.1.1");
   * console.log(`You have ${left} requests left.`);
   */
  async remaining(ip: string): Promise<number> {
    const current = (await this.cache.get(ip)) ?? 0;
    return Math.max(0, this.limit - current);
  }

  allow(ip: string): void {
    this.allowlist.add(ip);
    this.blocklist.delete(ip);
  }

  block(ip: string): void {
    this.blocklist.add(ip);
    this.allowlist.delete(ip);
  }

  unallow(ip: string): void {
    this.allowlist.delete(ip);
  }

  unblock(ip: string): void {
    this.blocklist.delete(ip);
  }
}

// Global instance for track-user endpoint (5 requests per IP per minute)
export const trackUserRateLimiter = new RateLimiter(5, 60000);

// Global instance for notify endpoint (5 requests per IP per minute)
export const notifyRateLimiter = new RateLimiter(5, 60000);

/**
 * Lightweight in-memory rate limiter for Next.js Edge Middleware.
 *
 * Note: In a distributed edge environment, this is per-instance.
 * For global rate limiting, a distributed store like Redis would be required.
 */

const trackers = new DistributedCache<{ count: number }>(2000, 60000);

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
export async function rateLimit(
  ip: string,
  limit: number = 60,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const now = Date.now();
  const tracker = await trackers.get(ip);

  if (!tracker) {
    await trackers.set(ip, { count: 1 }, windowMs);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    };
  }

  tracker.count++;
  await trackers.update(ip, tracker);

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
