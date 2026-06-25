import 'server-only';
import { DistributedCache } from './cache';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Rate limiter to prevent basic DoS/spam (Denial of Wallet).
 *
 * When Upstash Redis / Vercel KV is configured (KV_REST_API_URL + KV_REST_API_TOKEN
 * environment variables), rate limit state is persisted across restarts and shared
 * across all serverless instances via atomic INCR + EXPIRE operations.
 *
 * Falls back to an in-memory TTL cache when KV is not configured. In this mode,
 * state resets on cold start / server restart, but it is highly effective at
 * stopping aggressive single-instance spikes during normal operation.
 *
 * @see https://upstash.com/docs/rate-limiting/quickstart for KV setup instructions.
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
            ['TTL', `ratelimit_class:${ip}`],
          ]),
        });

        if (res.ok) {
          const getData = await res.json();
          const currentCount = parseInt(getData[0].result ?? '0', 10);
          const ttl = getData[1].result as number;

          if (currentCount >= this.limit) {
            return {
              success: false,
              limit: this.limit,
              remaining: 0,
              reset: ttl > 0 ? now + ttl * 1000 : now + this.windowMs,
            };
          }

          const incrRes = await fetch(`${url}/pipeline`, {
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

          if (incrRes.ok) {
            const incrData = await incrRes.json();
            const count = incrData[0].result as number;
            return {
              success: count <= this.limit,
              limit: this.limit,
              remaining: Math.max(0, this.limit - count),
              reset: now + this.windowMs,
            };
          }
        }
      } catch (error) {
        console.error('RateLimiter KV error, falling back to memory:', error);
      }
    }

    // Atomic increment to avoid TOCTOU race condition where concurrent requests
    // all read count=0 and all proceed past the limit check.
    const count = await this.cache.incr(`ratelimit:${ip}`, this.windowMs);
    const resetAt = now + this.windowMs;

    if (count > this.limit) {
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: resetAt,
      };
    }

    return {
      success: true,
      limit: this.limit,
      remaining: Math.max(0, this.limit - count),
      reset: resetAt,
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
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (url && token) {
      try {
        await fetch(`${url}/pipeline`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([['DEL', `ratelimit_class:${ip}`]]),
        });
      } catch (error) {
        console.error('RateLimiter KV reset error:', error);
      }
    }

    await this.cache.delete(`ratelimit:${ip}`);
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
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (url && token) {
      try {
        const res = await fetch(`${url}/get/ratelimit_class:${ip}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();

          const count = Number(data.result ?? 0);

          return Math.max(0, this.limit - count);
        }
      } catch (error) {
        console.error('RateLimiter KV remaining error:', error);
      }
    }

    const cached = await this.cache.get(`ratelimit:${ip}`);

    const count = typeof cached === 'number' ? cached : (cached?.count ?? 0);

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
 * @param namespace - Isolation namespace for the cache key. Different namespaces
 *   use independent counters, preventing cross-route interference.
 *   Defaults to `'default'`.
 * @returns A {@link RateLimitResult} containing success status, limit, remaining count, and reset time.
 *
 * @example
 * const result = rateLimit(ip, 60, 60000, 'api');
 * if (!result.success) {
 *   return new Response("Too Many Requests", { status: 429 });
 * }
 */
export async function rateLimit(
  ip: string,
  limit: number = 60,
  windowMs: number = 60000,
  namespace: string = 'default'
): Promise<RateLimitResult> {
  if (!ip || ip.trim().length === 0) {
    throw new TypeError('Cache key cannot be empty');
  }

  const cacheKey = `ratelimit:${namespace}:${ip}`;
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
          ['INCR', cacheKey],
          ['EXPIRE', cacheKey, Math.floor(windowMs / 1000), 'NX'],
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

  // Atomic increment to avoid TOCTOU race condition where concurrent requests
  // all read count=0 and all proceed past the limit check.
  const count = await trackers.incr(cacheKey, windowMs);
  const resetAt = now + windowMs;

  return {
    success: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    reset: resetAt,
  };
}

export function getRateLimitHeaders(result: RateLimitResult) {
  const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));

  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    'Retry-After': retryAfter.toString(),
  };
}
