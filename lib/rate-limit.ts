import { kv } from '@vercel/kv';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Normalizes and hashes the IP address to prevent keyspace pollution
 * and bounded key lengths in Redis.
 */
async function getIpHash(ip: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for environments where crypto.subtle is unavailable
  return encodeURIComponent(ip);
}

/**
 * Global rate limiter using Vercel KV (Redis) to prevent DoS attacks.
 * In serverless environments, this ensures rate limits and blocklists
 * are globally synchronized across all instances.
 */
export class RateLimiter {
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
  }

  async check(ip: string): Promise<boolean> {
    const result = await this.checkWithResult(ip);
    return result.success;
  }

  async checkWithResult(ip: string): Promise<RateLimitResult> {
    const windowSeconds = Math.ceil(this.windowMs / 1000);
    let resetMs = this.windowMs;

    try {
      const hashedIp = await getIpHash(ip);

      const key = `ratelimit:ip:${hashedIp}`;

      // Execute all KV operations in a single pipeline round-trip
      const p = kv.pipeline();
      p.sismember('ratelimit:allowlist', hashedIp);
      p.sismember('ratelimit:blocklist', hashedIp);
      p.incr(key);
      p.pttl(key);

      const [isAllowed, isBlocked, current, pttl] = (await p.exec()) as [
        number,
        number,
        number,
        number,
      ];

      if (isAllowed) {
        return {
          success: true,
          limit: this.limit,
          remaining: this.limit,
          reset: Date.now() + resetMs,
        };
      }

      if (isBlocked) {
        return {
          success: false,
          limit: this.limit,
          remaining: 0,
          reset: Date.now() + resetMs,
        };
      }

      if (current === 1 || pttl === -1) {
        // Set expiry (fire and forget to not block the hot path)
        kv.expire(key, windowSeconds).catch((e: unknown) => console.warn('KV Expire Error:', e));
      } else if (pttl > 0) {
        resetMs = pttl;
      }

      const reset = Date.now() + resetMs;

      if (current > this.limit) {
        return {
          success: false,
          limit: this.limit,
          remaining: 0,
          reset,
        };
      }

      return {
        success: true,
        limit: this.limit,
        remaining: this.limit - current,
        reset,
      };
    } catch (error) {
      // Fail open mechanism
      console.warn(`[RateLimiter] KV Error, bypassing rate limit for IP: ${ip}. Error:`, error);
      return { success: true, limit: this.limit, remaining: 1, reset: Date.now() + resetMs };
    }
  }

  async reset(ip: string): Promise<void> {
    try {
      const hashedIp = await getIpHash(ip);
      await kv.del(`ratelimit:ip:${hashedIp}`);
    } catch (error) {
      console.warn(`[RateLimiter] KV Error resetting IP: ${ip}`, error);
    }
  }

  async remaining(ip: string): Promise<number> {
    try {
      const hashedIp = await getIpHash(ip);
      const current = await kv.get<number>(`ratelimit:ip:${hashedIp}`);
      return Math.max(0, this.limit - (current ?? 0));
    } catch (error) {
      console.warn(`[RateLimiter] KV Error getting remaining for IP: ${ip}`, error);
      return this.limit;
    }
  }

  // ---------------------------------------------------------------------------
  // Synchronous wrappers for API backward compatibility (fire and forget)
  // ---------------------------------------------------------------------------

  allow(ip: string): void {
    this.allowAsync(ip).catch((e: unknown) => console.error(e));
  }

  block(ip: string): void {
    this.blockAsync(ip).catch((e: unknown) => console.error(e));
  }

  unallow(ip: string): void {
    this.unallowAsync(ip).catch((e: unknown) => console.error(e));
  }

  unblock(ip: string): void {
    this.unblockAsync(ip).catch((e: unknown) => console.error(e));
  }

  // ---------------------------------------------------------------------------
  // Internal async implementations
  // ---------------------------------------------------------------------------

  private async allowAsync(ip: string): Promise<void> {
    try {
      const hashedIp = await getIpHash(ip);
      await kv.sadd('ratelimit:allowlist', hashedIp);
      await kv.srem('ratelimit:blocklist', hashedIp);
    } catch (error) {
      console.warn(`[RateLimiter] KV Error allowing IP: ${ip}`, error);
    }
  }

  private async blockAsync(ip: string): Promise<void> {
    try {
      const hashedIp = await getIpHash(ip);
      await kv.sadd('ratelimit:blocklist', hashedIp);
      await kv.srem('ratelimit:allowlist', hashedIp);
    } catch (error) {
      console.warn(`[RateLimiter] KV Error blocking IP: ${ip}`, error);
    }
  }

  private async unallowAsync(ip: string): Promise<void> {
    try {
      const hashedIp = await getIpHash(ip);
      await kv.srem('ratelimit:allowlist', hashedIp);
    } catch (error) {
      console.warn(`[RateLimiter] KV Error unallowing IP: ${ip}`, error);
    }
  }

  private async unblockAsync(ip: string): Promise<void> {
    try {
      const hashedIp = await getIpHash(ip);
      await kv.srem('ratelimit:blocklist', hashedIp);
    } catch (error) {
      console.warn(`[RateLimiter] KV Error unblocking IP: ${ip}`, error);
    }
  }
}

// Global instance for track-user endpoint (5 requests per IP per minute)
export const trackUserRateLimiter = new RateLimiter(5, 60000);

// Global instance for notify endpoint (5 requests per IP per minute)
export const notifyRateLimiter = new RateLimiter(5, 60000);

/**
 * Global rate limiter for Next.js Edge Middleware using Vercel KV.
 */
export async function rateLimit(
  ip: string,
  limit: number = 60,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(windowMs / 1000);
  let resetMs = windowMs;

  try {
    const hashedIp = await getIpHash(ip);
    const key = `ratelimit:edge:${hashedIp}`;

    // Use pipeline to reduce round-trips
    const p = kv.pipeline();
    p.incr(key);
    p.pttl(key);
    const [current, pttl] = (await p.exec()) as [number, number];

    if (current === 1 || pttl === -1) {
      // Fire and forget expiry
      kv.expire(key, windowSeconds).catch((e: unknown) => console.warn('KV Expire Error:', e));
    } else if (pttl > 0) {
      resetMs = pttl;
    }

    const reset = Date.now() + resetMs;

    if (current > limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset,
      };
    }

    return {
      success: true,
      limit,
      remaining: limit - current,
      reset,
    };
  } catch (error) {
    console.warn(`[rateLimit Middleware] KV Error, bypassing rate limit for IP: ${ip}`, error);
    return {
      success: true,
      limit,
      remaining: 1,
      reset: Date.now() + resetMs,
    };
  }
}
