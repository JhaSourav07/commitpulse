import 'server-only';
import { DistributedCache } from './cache';
import logger from '@/lib/logger';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// ---------------------------------------------------------------------------
// Lua script executed atomically on Redis via EVAL.
//
// Why Lua and not a plain INCR+EXPIRE pipeline?
// A pipeline sends both commands in one network round-trip but Redis still
// executes them one-by-one. Between the INCR and EXPIRE another request can
// land, read the counter, or even let the key expire mid-flight — the classic
// TOCTOU (Time-Of-Check To Time-Of-Use) race.
//
// Redis guarantees that a Lua script runs as a single atomic operation: no
// other command can interleave while the script is executing.
//
// Script contract
//   KEYS[1]  – the rate-limit key (e.g. "ratelimit_class:<ip>")
//   ARGV[1]  – limit   (number of requests allowed per window)
//   ARGV[2]  – window  (seconds)
//
// Returns: {allowed, newCount, ttlSeconds}
//   allowed  – 1 if the request is within the limit, 0 if it is blocked
//   newCount – counter value after this request
//   ttl      – remaining seconds until the window resets (-1 means no expiry
//              was set yet, which should not happen in normal flow)
// ---------------------------------------------------------------------------
const RATE_LIMIT_SCRIPT = `
local key    = KEYS[1]
local limit  = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local current = tonumber(redis.call('GET', key) or 0)

if current >= limit then
  local ttl = redis.call('TTL', key)
  return {0, current, ttl}
end

local newCount = redis.call('INCR', key)
if newCount == 1 then
  redis.call('EXPIRE', key, window)
end

local ttl = redis.call('TTL', key)
return {1, newCount, ttl}
`;

// ---------------------------------------------------------------------------
// Helper: call Upstash Redis REST API with a single EVAL command.
// Returns the parsed [allowed, count, ttl] tuple, or null on failure.
// ---------------------------------------------------------------------------
async function evalRateLimitScript(
  url: string,
  token: string,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<[number, number, number] | null> {
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        [
          'EVAL',
          RATE_LIMIT_SCRIPT,
          '1', // number of KEYS
          key,
          limit.toString(),
          windowSeconds.toString(),
        ],
      ]),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const result = data[0]?.result as [number, number, number] | undefined;
    if (!Array.isArray(result) || result.length < 3) return null;

    return result;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper: fetch the current counter for an IP from Redis (read-only GET).
// Returns the count, or null on failure.
// ---------------------------------------------------------------------------
async function getCountFromRedis(url: string, token: string, key: string): Promise<number | null> {
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([['GET', key]]),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const raw = data[0]?.result;
    return raw !== null && raw !== undefined ? parseInt(raw, 10) : 0;
  } catch {
    return null;
  }
}

/**
 * Returns whether the in-memory rate limit fallback is allowed.
 *
 * In production, rate limiting requires a distributed backend (Upstash Redis /
 * Vercel KV) because each serverless invocation is an isolated process with its
 * own in-memory state — an in-memory fallback would be effectively useless.
 *
 * To opt-in to in-memory rate limiting in production (NOT recommended), set
 * `DANGEROUSLY_ALLOW_IN_MEMORY_RATE_LIMIT=true`. This should only be used
 * temporarily during initial deployment before KV is configured.
 *
 * In development/test, in-memory fallback is always allowed.
 */
export function isInMemoryRateLimitAllowed(): boolean {
  // Always allow in development/test
  if (process.env.NODE_ENV !== 'production') return true;

  // In production, only allow if explicitly opted-in
  return process.env.DANGEROUSLY_ALLOW_IN_MEMORY_RATE_LIMIT === 'true';
}

/**
 * Checks whether the distributed rate limiting backend (Upstash Redis / Vercel KV)
 * is configured. Returns true only if both KV_REST_API_URL and KV_REST_API_TOKEN
 * are set.
 */
function isDistributedBackendConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Rate limiter to prevent basic DoS/spam (Denial of Wallet).
 *
 * When Upstash Redis / Vercel KV is configured (KV_REST_API_URL + KV_REST_API_TOKEN
 * environment variables), rate limit state is persisted across restarts and shared
 * across all serverless instances via atomic INCR + EXPIRE operations.
 *
 * In production, if KV is not configured, requests are REJECTED (fail closed)
 * to prevent denial-of-service / denial-of-wallet attacks. Set
 * `DANGEROUSLY_ALLOW_IN_MEMORY_RATE_LIMIT=true` to opt-in to in-memory fallback
 * in production (NOT recommended — each serverless invocation has isolated state).
 *
 * In development/test, in-memory fallback is always available.
 *
 * @see https://upstash.com/docs/rate-limiting/quickstart for KV setup instructions.
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

    // ------------------------------------------------------------------
    // Redis path — atomic Lua EVAL (replaces the old INCR+EXPIRE pipeline)
    //
    // The old pipeline was vulnerable to a TOCTOU race: two concurrent
    // requests could both read the pre-increment counter, both pass the
    // limit check, and both be allowed even though only one should be.
    // The Lua script collapses check+increment+expire into one atomic unit
    // so no other command can interleave.
    // ------------------------------------------------------------------
    if (isDistributedBackendConfigured()) {
      const url = process.env.KV_REST_API_URL!;
      const token = process.env.KV_REST_API_TOKEN!;
      const windowSeconds = Math.floor(this.windowMs / 1000);
      const result = await evalRateLimitScript(
        url,
        token,
        `ratelimit_class:${ip}`,
        this.limit,
        windowSeconds
      );

      if (result !== null) {
        const [allowed, count, ttl] = result;
        const resetMs = ttl > 0 ? now + ttl * 1000 : now + this.windowMs;
        return {
          success: allowed === 1,
          limit: this.limit,
          remaining: Math.max(0, this.limit - count),
          reset: resetMs,
        };
      }

      // KV is configured but the request failed — fail closed
      logger.error('RateLimiter KV request failed — rejecting to prevent bypass', {
        component: 'RateLimiter',
        ip,
      });
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: now + this.windowMs,
      };
    }

    // ------------------------------------------------------------------
    // In-memory fallback — only allowed in development or with explicit opt-in.
    // In production without KV, fail closed to prevent denial-of-service.
    // ------------------------------------------------------------------
    if (!isInMemoryRateLimitAllowed()) {
      logger.warn('Rate limiting unavailable (KV not configured) — rejecting request', {
        component: 'RateLimiter',
        ip,
        hint: 'Set KV_REST_API_URL + KV_REST_API_TOKEN for distributed rate limiting, or DANGEROUSLY_ALLOW_IN_MEMORY_RATE_LIMIT=true for development.',
      });
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: now + this.windowMs,
      };
    }

    const cacheKey = `ratelimit:${ip}`;
    const count = await this.cache.incr(cacheKey, this.windowMs);
    const resetAt = this.cache.getExpiresAt(cacheKey) ?? now + this.windowMs;

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
   * Previously this method only read from the in-memory cache, which meant
   * it always returned a stale/wrong value when Redis was active (because
   * `checkWithResult` was writing to Redis, not to the local cache).
   * It now queries Redis first and falls back to memory.
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
    if (isDistributedBackendConfigured()) {
      const count = await getCountFromRedis(
        process.env.KV_REST_API_URL!,
        process.env.KV_REST_API_TOKEN!,
        `ratelimit_class:${ip}`
      );
      if (count !== null) {
        return Math.max(0, this.limit - count);
      }
      logger.error('RateLimiter remaining() KV request failed', {
        component: 'RateLimiter',
        ip,
      });
    }

    // In-memory fallback — only allowed in development or with explicit opt-in.
    if (!isInMemoryRateLimitAllowed()) {
      return 0; // Fail closed: report no remaining requests
    }

    const cached = (await this.cache.get(`ratelimit:${ip}`)) ?? 0;

    return Math.max(0, this.limit - cached);
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
 * all serverless instances via an atomic Lua script (EVAL).
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

  // ------------------------------------------------------------------
  // Redis path — atomic Lua EVAL (replaces the old INCR+EXPIRE pipeline)
  // See comment in RateLimiter.checkWithResult for full explanation.
  // ------------------------------------------------------------------
  if (isDistributedBackendConfigured()) {
    const windowSeconds = Math.floor(windowMs / 1000);
    const result = await evalRateLimitScript(
      process.env.KV_REST_API_URL!,
      process.env.KV_REST_API_TOKEN!,
      cacheKey,
      limit,
      windowSeconds
    );

    if (result !== null) {
      const [allowed, count, ttl] = result;
      const resetMs = ttl > 0 ? now + ttl * 1000 : now + windowMs;
      return {
        success: allowed === 1,
        limit,
        remaining: Math.max(0, limit - count),
        reset: resetMs,
      };
    }

    // KV is configured but the request failed — fail closed
    logger.error('Rate limit KV request failed — rejecting to prevent bypass', {
      component: 'rateLimit',
      ip,
    });
    return {
      success: false,
      limit,
      remaining: 0,
      reset: now + windowMs,
    };
  }

  // ------------------------------------------------------------------
  // In-memory fallback — only allowed in development or with explicit opt-in.
  // In production without KV, fail closed to prevent denial-of-service.
  // ------------------------------------------------------------------
  if (!isInMemoryRateLimitAllowed()) {
    logger.warn('Rate limiting unavailable (KV not configured) — rejecting request', {
      component: 'rateLimit',
      ip,
      hint: 'Set KV_REST_API_URL + KV_REST_API_TOKEN for distributed rate limiting, or DANGEROUSLY_ALLOW_IN_MEMORY_RATE_LIMIT=true for development.',
    });
    return {
      success: false,
      limit,
      remaining: 0,
      reset: now + windowMs,
    };
  }

  const count = await trackers.incr(cacheKey, windowMs);
  const resetAt = trackers.getExpiresAt(cacheKey) ?? now + windowMs;

  return {
    success: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    reset: resetAt,
  };
}

/**
 * Builds the standard rate-limit response headers from a {@link RateLimitResult}.
 *
 * `Retry-After` is expressed in seconds per RFC 9110 §10.2.3.
 * `result.reset` is an epoch-ms value so we convert before setting the header.
 */
export function getRateLimitHeaders(result: RateLimitResult) {
  const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));

  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    'Retry-After': retryAfter.toString(),
  };
}
