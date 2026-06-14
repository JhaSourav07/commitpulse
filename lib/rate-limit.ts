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
   *clean
   * @param limit - Maximum number of requests allowed per window. Defaults to 5.
   * @param windowMs - Time window in milliseconds. Defaults to 60000 (1 minute).
   */
  constructor(limit = 5, windowMs = 60000, maxSize = 10000) {
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
      await this.cache.set(ip, current + 1, this.windowMs);
    }
    return true;
  }
  async checkWithResult(ip: string): Promise<RateLimitResult> {
    const current = (await this.cache.get(ip)) ?? 0;
    const now = Date.now();

    if (this.allowlist.has(ip))
      return {
        success: true,
        limit: this.limit,
        remaining: this.limit,
        reset: now + this.windowMs,
      };

    if (this.blocklist.has(ip))
      return { success: false, limit: this.limit, remaining: 0, reset: now + this.windowMs };

    // 4. Standard Rate Limiting Logic for normal users:
    if (current >= this.limit) {
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: now + this.windowMs,
      };
    }

    // Increment and update cache for the current request
    await this.cache.set(ip, current + 1, this.windowMs);

    return {
      success: true,
      limit: this.limit,
      remaining: this.limit - (current + 1),
      reset: now + this.windowMs,
    };

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

    const record = (await this.cache.get(ip)) as { count: number; resetAt: number } | null;
    const count = record?.count ?? 0;

    if (count >= this.limit) {
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: record?.resetAt ?? now + this.windowMs,
      };
    }

    if (current === 0) {
      await this.cache.set(ip, 1, this.windowMs);
    } else {
      await this.cache.set(ip, current + 1, this.windowMs);
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
  const tracker = (await trackers.get(ip)) as { count: number; resetAt: number } | null;

  if (!tracker) {
    const resetAtTime = Date.now() + windowMs;
    await trackers.set(ip, { count: 1 }, windowMs);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: resetAtTime,
    };
  }

  tracker.count++;
  await trackers.set(ip, tracker, windowMs);

  // If the window has expired or reset is needed, recalculate
  if (Date.now() > tracker.resetAt) {
    const resetAtTime = Date.now() + windowMs;
    await trackers.set(ip, { count: 1 }, windowMs);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: resetAtTime,
    };
  }

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

export function getRateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}
