// lib/rate-limiter.ts

export class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  isLimitExceeded(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Filter out timestamps outside of the window
    const activeTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (activeTimestamps.length >= this.limit) {
      return true;
    }

    activeTimestamps.push(now);
    this.requests.set(key, activeTimestamps);
    return false;
  }

  clear(): void {
    this.requests.clear();
  }
}

// Default rate limiter: 60 requests per 1 minute (60,000 ms)
export const ipRateLimiter = new RateLimiter(60, 60000);
