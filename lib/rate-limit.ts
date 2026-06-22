import { DistributedCache } from './cache';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

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
        ['EVAL', RATE_LIMIT_SCRIPT, '1', key, limit.toString(), windowSeconds.toString()],
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

export class RateLimiter {
  private cache: DistributedCache<{ count: number; resetAt: number }>;
  private limit: number;
  private windowMs: number;
  private allowlist = new Set<string>();
  private blocklist = new Set<string>();

  constructor(limit = 5, windowMs = 60000, maxSize = 10000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.cache = new DistributedCache<{ count: number; resetAt: number }>(maxSize, windowMs);
  }

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

      console.error('RateLimiter KV error, falling back to memory');
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
    }

    const resetAt = record.resetAt;
    const updated = await this.cache.update(ip, { count: count + 1, resetAt });

    if (!updated) {
      const freshResetAt = now + this.windowMs;
      await this.cache.set(ip, { count: 1, resetAt: freshResetAt }, this.windowMs);
      return {
        success: true,
        limit: this.limit,
        remaining: this.limit - 1,
        reset: freshResetAt,
      };
    }

    return {
      success: true,
      limit: this.limit,
      remaining: this.limit - (count + 1),
      reset: resetAt,
    };
  }

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

  async remaining(ip: string): Promise<number> {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (url && token) {
      const count = await getCountFromRedis(url, token, `ratelimit_class:${ip}`);
      if (count !== null) {
        return Math.max(0, this.limit - count);
      }
      console.error('RateLimiter remaining() KV error, falling back to memory');
    }

    const record = await this.cache.get(ip);
    return Math.max(0, this.limit - (record?.count ?? 0));
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

export const trackUserRateLimiter = new RateLimiter(5, 60000);

export const notifyRateLimiter = new RateLimiter(5, 60000);

const trackers = new DistributedCache<{ count: number; resetAt: number }>(2000, 60000);

export async function rateLimit(
  ip: string,
  limit: number = 60,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const now = Date.now();
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (url && token) {
    const windowSeconds = Math.floor(windowMs / 1000);
    const result = await evalRateLimitScript(url, token, `ratelimit:${ip}`, limit, windowSeconds);

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

    console.error('Rate limit KV error, falling back to memory');
  }

  const tracker = await trackers.get(ip);

  if (!tracker) {
    const resetAt = now + windowMs;
    await trackers.set(ip, { count: 1, resetAt }, windowMs);
    return { success: true, limit, remaining: limit - 1, reset: resetAt };
  }

  const newCount = tracker.count + 1;
  const updated = await trackers.update(ip, { count: newCount, resetAt: tracker.resetAt });

  if (!updated) {
    const resetAt = now + windowMs;
    await trackers.set(ip, { count: 1, resetAt }, windowMs);
    return { success: true, limit, remaining: limit - 1, reset: resetAt };
  }

  if (newCount > limit) {
    return { success: false, limit, remaining: 0, reset: tracker.resetAt };
  }

  return { success: true, limit, remaining: limit - newCount, reset: tracker.resetAt };
}

export function getRateLimitHeaders(result: RateLimitResult) {
  const retryAfterSeconds = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));

  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    'Retry-After': retryAfterSeconds.toString(),
  };
}
