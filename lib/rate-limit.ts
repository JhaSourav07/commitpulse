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
  private cache: DistributedCache<{ count: number; resetAt: number }>;
  private limit: number;
  private windowMs: number;
  private allowlist = new Set<string>();
  private blocklist = new Set<string>();

  /**
   * Creates a new RateLimiter instance.
   *clean
   * @param limit - Maximum number of requests allowed per window. Defaults to 5.
   * @param windowMs - Time window in milliseconds. Defaults to 60000 (1 minute).
   */
  constructor(limit = 5, windowMs = 60000, maxSize = 10000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.cache = new DistributedCache<{ count: number; resetAt: number }>(maxSize, windowMs);
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
    const result = await this.checkWithResult(ip);
    return result.success;
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
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (url && token) {
      try {
        const res = await fetch(`${url}/pipeline`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            ['INCR', `ratelimit_class:${ip}`],
            ['EXPIRE', `ratelimit_class:${ip}`, Math.floor(this.windowMs / 1000), 'NX'],
          ]),
        });

        if (res.ok) {
          const data = await res.json();
          const count = data[0].result as number;
          return {
            success: count <= this.limit,
            limit: this.limit,
            remaining: Math.max(0, this.limit - count),
            reset: now + this.windowMs,
          };
        }
      } catch (error) {
        console.error('RateLimiter KV error, falling back to memory:', error);
      }
    }

    const record = await this.cache.get(ip);
    const count = record?.count ?? 0;

    if (count >= this.limit) {
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: record?.resetAt ?? now + this.windowMs,
      };
    }

    if (!record) {
      const resetAt = now + this.windowMs;
      await this.cache.set(ip, { count: 1, resetAt }, this.windowMs);
      return {
        success: true,
        limit: this.limit,
        remaining: this.limit - 1,
        reset: resetAt,
      };
    } else {
      const resetAt = record.resetAt;
      await this.cache.update(ip, { count: count + 1, resetAt });
      return {
        success: true,
        limit: this.limit,
        remaining: this.limit - (count + 1),
        reset: resetAt,
      };
    }
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
    const record = await this.cache.get(ip);
    const count = record?.count ?? 0;
    return Math.max(0, this.limit - count);
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
 * Distributed rate limiter for Next.js Edge Middleware.
 *
 * When Upstash Redis / Vercel KV is configured, counters are shared across
 * all serverless instances via atomic INCR + EXPIRE Lua scripts.
 * Falls back to a local in-memory cache for development environments.
 */

const trackers = new DistributedCache<{ count: number; resetAt: number }>(2000, 60000);

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
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  // Use Upstash Redis if configured
  if (url && token) {
    try {
      const res = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', `ratelimit:${ip}`],
          ['EXPIRE', `ratelimit:${ip}`, Math.floor(windowMs / 1000), 'NX'],
        ]),
      });

      if (res.ok) {
        const data = await res.json();
        const count = data[0].result as number;
        return {
          success: count <= limit,
          limit,
          remaining: Math.max(0, limit - count),
          reset: now + windowMs, // Approximated for simplicity
        };
      }
    } catch (error) {
      console.error('Rate limit KV error, falling back to memory:', error);
    }
  }

  // Fallback to local in-memory cache
  const tracker = await trackers.get(ip);

  if (!tracker) {
    const resetAt = now + windowMs;
    await trackers.set(ip, { count: 1, resetAt }, windowMs);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: resetAt,
    };
  }

  tracker.count++;
  await trackers.update(ip, tracker);

  if (tracker.count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: tracker.resetAt,
    };
  }

  return {
    success: true,
    limit,
    remaining: limit - tracker.count,
    reset: tracker.resetAt,
  };
}
