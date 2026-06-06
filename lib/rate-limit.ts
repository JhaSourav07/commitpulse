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
  constructor(limit = 5, windowMs = 60000, maxSize = 10000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.cache = new DistributedCache<number>(maxSize, windowMs);
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
        const ttlSec = Math.floor(this.windowMs / 1000);
        const luaScript = `local c = redis.call('INCR', KEYS[1])
if c == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
return {c, ttl}`;

        const res = await fetch(`${url}/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(['EVAL', luaScript, '1', `ratelimit_class:${ip}`, ttlSec.toString()]),
        });

        if (res.ok) {
          const data = await res.json();
          const result = data.result;
          const count = Number(result[0]);
          const ttlRemaining = Number(result[1]) * 1000;
          return {
            success: count <= this.limit,
            limit: this.limit,
            remaining: Math.max(0, this.limit - count),
            reset: now + Math.max(0, ttlRemaining),
          };
        }
      } catch (error) {
        console.error('RateLimiter KV error, falling back to memory:', error);
      }
    }

    const result = await this.cache.incr(ip, this.windowMs);

    if (result.count > this.limit) {
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: now + result.ttlRemaining,
      };
    }

    return {
      success: true,
      limit: this.limit,
      remaining: Math.max(0, this.limit - result.count),
      reset: now + result.ttlRemaining,
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
    const count = (await this.cache.get(ip)) ?? 0;
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

const trackers = new DistributedCache<number>(2000, 60000);

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
      const ttlSec = Math.floor(windowMs / 1000);
      const luaScript = `local c = redis.call('INCR', KEYS[1])
if c == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
return {c, ttl}`;

      const res = await fetch(`${url}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['EVAL', luaScript, '1', `ratelimit:${ip}`, ttlSec.toString()]),
      });

      if (res.ok) {
        const data = await res.json();
        const result = data.result;
        const count = Number(result[0]);
        const ttlRemaining = Number(result[1]) * 1000;
        return {
          success: count <= limit,
          limit,
          remaining: Math.max(0, limit - count),
          reset: now + Math.max(0, ttlRemaining),
        };
      }
    } catch (error) {
      console.error('Rate limit KV error, falling back to memory:', error);
    }
  }

  // Fallback to local in-memory cache using atomic increment
  const result = await trackers.incr(ip, windowMs);

  return {
    success: result.count <= limit,
    limit,
    remaining: Math.max(0, limit - result.count),
    reset: now + result.ttlRemaining,
  };
}

export function getRateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}
