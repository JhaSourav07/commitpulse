import 'server-only';
import { TTLCache } from '../../lib/cache';

interface RefreshLimitRecord {
  count: number;
  windowStart: number;
}

/**
 * In-memory rate limiter for manual cache refresh operations.
 *
 * Limits how frequently a single IP can trigger a manual data refresh.
 * Uses a TTL-based in-memory cache that expires entries automatically.
 *
 * ⚠️ Limitation: State is per-process only. In serverless deployments
 * (Vercel, AWS Lambda), each cold start resets the limiter. This is
 * acceptable for abuse prevention on a single instance, but not suitable
 * for strict cross-instance rate limiting.
 *
 * For production deployments requiring persistent state, consider using
 * Upstash Redis or Vercel KV by importing from '@/lib/rate-limit' instead.
 */
export class RefreshRateLimiter {
  private static instance: RefreshRateLimiter;

  // Default limits: 3 refreshes per hour
  private limit = 3;
  private windowMs = 60 * 60 * 1000; // 1 hour

  private tracker = new TTLCache<RefreshLimitRecord>(100000, 60 * 60 * 1000);

  private constructor() {
    this.loadLimitFromEnv();
  }

  public static getInstance(): RefreshRateLimiter {
    if (!RefreshRateLimiter.instance) {
      RefreshRateLimiter.instance = new RefreshRateLimiter();
    }
    return RefreshRateLimiter.instance;
  }

  private loadLimitFromEnv(): void {
    const envLimit = process.env.MAX_REFRESHES_PER_HOUR;
    if (envLimit) {
      const parsed = parseInt(envLimit, 10);
      if (!isNaN(parsed) && parsed > 0) {
        this.limit = parsed;
      }
    }
  }

  /**
   * Set custom rate limit parameters (useful for tests).
   */
  public setLimit(limit: number, windowMs = 60 * 60 * 1000): void {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /**
   * Checks if an IP is allowed to perform a manual cache refresh.
   */
  public checkLimit(ip: string): {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  } {
    this.loadLimitFromEnv(); // Ensure latest env config is applied
    const now = Date.now();
    const clientKey = ip.trim() || '__unknown__';

    let record = this.tracker.get(clientKey);

    // If window expired or new client, reset the window
    if (!record || now - record.windowStart >= this.windowMs) {
      record = {
        count: 0,
        windowStart: now,
      };
      this.tracker.set(clientKey, record, this.windowMs);
    }

    const resetTime = record.windowStart + this.windowMs;

    if (record.count >= this.limit) {
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: resetTime,
      };
    }

    // Increment count on checking (optimistic allocation)
    record.count++;
    this.tracker.update(clientKey, record);

    return {
      success: true,
      limit: this.limit,
      remaining: this.limit - record.count,
      reset: resetTime,
    };
  }

  /**
   * Clears the limiter state (useful for tests).
   */
  public reset(): void {
    this.tracker.clear();
    this.limit = 3;
    this.windowMs = 60 * 60 * 1000;
  }
}

export const refreshRateLimiter = RefreshRateLimiter.getInstance();
export default refreshRateLimiter;
