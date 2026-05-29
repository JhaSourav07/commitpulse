import { TTLCache } from './cache';

// In-memory rate limiter to prevent basic DoS/spam (Denial of Wallet).
// Note: In a serverless environment, this resets per cold-start/instance,
// but it is highly effective at stopping aggressive single-instance spikes.
// For multi-instance strict syncing, a Redis store (Vercel KV/Upstash) should be used.
export class RateLimiter {
  private cache: TTLCache<number>;
  private limit: number;
  private windowMs: number;

  constructor(limit = 5, windowMs = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
    // Set max capacity to 10000 IPs to prevent memory leaks from the rate limiter itself
    this.cache = new TTLCache<number>(10000, windowMs);
  }

  // Returns true if allowed, false if rate limited
  check(ip: string): boolean {
    const current = this.cache.get(ip) || 0;
    if (current >= this.limit) {
      return false;
    }
    // We increment the count and reset the TTL, behaving similarly to a sliding window timeout.
    this.cache.set(ip, current + 1, this.windowMs);
    return true;
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
