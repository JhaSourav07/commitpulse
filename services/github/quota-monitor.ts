export class QuotaMonitor {
  private static instance: QuotaMonitor;

  private limit = 5000;
  private remaining = 5000;
  private resetTime = 0;
  private totalRefreshes = 0;

  private constructor() {}

  public static getInstance(): QuotaMonitor {
    if (!QuotaMonitor.instance) {
      QuotaMonitor.instance = new QuotaMonitor();
    }
    return QuotaMonitor.instance;
  }

  /**
   * Updates the internal quota state using standard GitHub response headers.
   */
  public updateQuotaFromHeaders(headers: Headers | Record<string, string>): void {
    const getHeader = (name: string): string | null => {
      if (headers instanceof Headers) {
        return headers.get(name);
      }
      return headers[name] || headers[name.toLowerCase()] || null;
    };

    const limitHeader = getHeader('x-ratelimit-limit');
    const remainingHeader = getHeader('x-ratelimit-remaining');
    const resetHeader = getHeader('x-ratelimit-reset');

    if (limitHeader) {
      const parsedLimit = parseInt(limitHeader, 10);
      if (!isNaN(parsedLimit)) this.limit = parsedLimit;
    }

    if (remainingHeader) {
      const parsedRemaining = parseInt(remainingHeader, 10);
      if (!isNaN(parsedRemaining)) this.remaining = parsedRemaining;
    }

    if (resetHeader) {
      const parsedReset = parseInt(resetHeader, 10);
      if (!isNaN(parsedReset)) this.resetTime = parsedReset * 1000; // Convert to ms
    }
  }

  /**
   * Updates quota manually (useful for mocking/testing).
   */
  public setQuota(limit: number, remaining: number, resetTimeMs: number): void {
    this.limit = limit;
    this.remaining = remaining;
    this.resetTime = resetTimeMs;
  }

  /**
   * Returns current quota information.
   */
  public getQuota() {
    return {
      limit: this.limit,
      remaining: this.remaining,
      resetTime: this.resetTime,
      totalRefreshes: this.totalRefreshes,
    };
  }

  /**
   * Tracks a successful refresh event.
   */
  public incrementRefreshCount(): void {
    this.totalRefreshes++;
  }

  /**
   * Returns true if remaining quota is less than 10%.
   */
  public isQuotaLow(): boolean {
    // If remaining is less than 10% of limit, flag quota as low
    return this.remaining < this.limit * 0.1;
  }

  /**
   * Resets monitor stats.
   */
  public reset(): void {
    this.limit = 5000;
    this.remaining = 5000;
    this.resetTime = 0;
    this.totalRefreshes = 0;
  }
}

export const quotaMonitor = QuotaMonitor.getInstance();
export default quotaMonitor;
