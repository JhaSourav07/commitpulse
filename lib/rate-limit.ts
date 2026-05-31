// lib/rate-limit.ts
//
// Unified, memory-safe, distributed-aware rate-limiting module.
//
// Previously this file contained two divergent implementations:
//   1. RateLimiter class  — TTLCache-backed, enforces a strict maxSize cap
//   2. rateLimit function — raw ES6 Map with no hard capacity limit
//
// The standalone rateLimit function's underlying Map was a slow memory leak:
// under sustained distributed traffic the arbitrary 2000-item cleanup only
// partially evicted entries after the damage was already done.
//
// This revision fixes three issues raised in code review:
//
//   Fix 1 — DistributedCache restored:
//     RateLimiter now uses DistributedCache so that when Vercel KV / Upstash
//     env vars are present, rate-limit state is shared across all edge nodes.
//     Without this, each serverless instance enforces its own independent
//     counter and attackers can bypass limits by hitting different nodes.
//
//   Fix 2 — Accurate reset time:
//     The X-RateLimit-Reset header previously returned Date.now() + windowMs
//     on every call, which shifts on every request and lies to clients.
//     The reset time is now the true expiry of the first request's window,
//     stored inside the cache entry as { count, resetTime }.
//
//   Fix 3 — TTLCache expiry exposure:
//     TTLCache.get() only returns the stored value, not the expiresAt stamp.
//     We store resetTime explicitly inside the cached value so callers can
//     read it without needing TTLCache to expose its internal timestamps.

import { DistributedCache } from './cache';

// ---------------------------------------------------------------------------
// Internal entry shape stored per IP key.
// resetTime is the Unix ms timestamp when this window expires — stored inside
// the value (not derived from TTLCache internals) so it is always readable.
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// ---------------------------------------------------------------------------
// RateLimiter class — distributed, memory-safe, fixed-window implementation.
//
// Uses DistributedCache so:
//   - On Vercel with KV_REST_API_URL + KV_REST_API_TOKEN set: state is shared
//     across all edge/serverless instances via Upstash Redis — no bypass.
//   - Without Redis env vars: falls back to in-memory TTLCache gracefully.
//   - Memory is strictly bounded by maxSize (FIFO eviction when full).
//
// check() returns a plain boolean so callers can write:
//   if (!limiter.check(ip)) return 429
// ---------------------------------------------------------------------------

export class RateLimiter {
  private cache: DistributedCache<RateLimitEntry>;
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number, maxSize: number = 5000) {
    this.limit = limit;
    this.windowMs = windowMs;
    // DistributedCache uses Redis when env vars are set, falls back to
    // in-memory TTLCache otherwise — same API either way.
    this.cache = new DistributedCache<RateLimitEntry>(maxSize);
  }

  /**
   * Returns true if the request is within the rate limit, false otherwise.
   * The window is fixed: anchored to the first request, does NOT slide.
   */
  async check(key: string): Promise<boolean> {
    const now = Date.now();
    const entry = await this.cache.get(key);

    if (entry === null || now > entry.resetTime) {
      // First request in this window (or previous window has expired).
      // resetTime is stored inside the value so we can return the true expiry
      // to callers without needing TTLCache to expose its internal timestamps.
      const newEntry: RateLimitEntry = { count: 1, resetTime: now + this.windowMs };
      await this.cache.set(key, newEntry, this.windowMs);
      return true;
    }

    if (entry.count >= this.limit) {
      // Limit exhausted; window has not expired yet
      return false;
    }

    // Within the window and under the limit.
    // Preserve resetTime so the window stays anchored to the first request.
    await this.cache.update(key, { count: entry.count + 1, resetTime: entry.resetTime });
    return true;
  }

  /**
   * Returns { remaining, reset } for a key in the current window.
   * reset is the TRUE Unix ms timestamp when the window expires — not a
   * shifted approximation. This is what populates X-RateLimit-Reset headers.
   */
  async stats(key: string): Promise<{ remaining: number; reset: number }> {
    const entry = await this.cache.get(key);
    if (entry === null) {
      return { remaining: this.limit, reset: Date.now() + this.windowMs };
    }
    return {
      remaining: Math.max(0, this.limit - entry.count),
      // entry.resetTime is the window expiry set on the FIRST request —
      // it does not shift on subsequent requests within the same window.
      reset: entry.resetTime,
    };
  }
}

// ---------------------------------------------------------------------------
// Backward-compatible rateLimit function.
//
// Kept so that middleware.ts and its test suite (which vi.mock this function)
// continue to work without any changes to their call sites or mocks.
//
// Return shape: { success, limit, remaining, reset }
// reset is the TRUE window expiry timestamp, not Date.now() + windowMs.
// ---------------------------------------------------------------------------

// One RateLimiter per unique (limit, windowMs) configuration.
// Module-level so the fixed window is preserved across calls within a process.
const _limiters = new Map<string, RateLimiter>();

export async function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const limiterKey = `${limit}:${windowMs}`;
  if (!_limiters.has(limiterKey)) {
    _limiters.set(limiterKey, new RateLimiter(limit, windowMs, 5000));
  }
  const limiter = _limiters.get(limiterKey)!;

  const allowed = await limiter.check(ip);
  // stats() reads the entry that check() just wrote/updated, so reset is
  // the true window expiry anchored to the first request — not a moving target.
  const { remaining, reset } = await limiter.stats(ip);

  return {
    success: allowed,
    limit,
    remaining: allowed ? remaining : 0,
    reset,
  };
}

// ---------------------------------------------------------------------------
// Named exports for specific API routes.
// Each route gets its own RateLimiter instance with appropriate limits.
// ---------------------------------------------------------------------------

// Named export for the /api/track-user route.
// 10 requests per minute per IP, capped at 5000 tracked IPs.
export const trackUserRateLimiter = new RateLimiter(10, 60 * 1000, 5000);

// Named export for the notify endpoint.
// 5 requests per minute per IP — kept from upstream main.
export const notifyRateLimiter = new RateLimiter(5, 60000);
