interface RefreshLimitRecord {
  count: number;
  windowStart: number;
}

export class RefreshRateLimiter {
  private static instance: RefreshRateLimiter;

  // Default limits: 3 refreshes per hour
  private limit = 3;
  private windowMs = 60 * 60 * 1000; // 1 hour

  private tracker = new Map<string, RefreshLimitRecord>();

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
    const clientKey = ip.trim();

    let record = this.tracker.get(clientKey);

    // If window expired or new client, reset the window
    if (!record || now - record.windowStart >= this.windowMs) {
      record = {
        count: 0,
        windowStart: now,
      };
      this.tracker.set(clientKey, record);
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
