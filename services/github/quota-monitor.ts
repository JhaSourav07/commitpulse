import 'server-only';
interface TokenQuotaState {
  limit: number;
  remaining: number;
  resetTime: number;
}

export class QuotaMonitor {
  private static instance: QuotaMonitor;
  private tokenQuotas = new Map<string, TokenQuotaState>();
  private totalRefreshes = 0;

  private constructor() {}

  public static getInstance(): QuotaMonitor {
    if (!QuotaMonitor.instance) {
      QuotaMonitor.instance = new QuotaMonitor();
    }
    return QuotaMonitor.instance;
  }

  /**
   * Updates quota state for a specific token using standard GitHub response headers.
   * Falls back to a shared '__default__' key when no token identity is supplied,
   * preserving backward compatibility for callers that don't yet pass one.
   */
  public updateQuotaFromHeaders(
    headers: Headers | Record<string, string>,
    token: string = '__default__'
  ): void {
    const getHeader = (name: string): string | null => {
      if (headers instanceof Headers) {
        return headers.get(name);
      }
      return headers[name] || headers[name.toLowerCase()] || null;
    };

    const limitHeader = getHeader('x-ratelimit-limit');
    const remainingHeader = getHeader('x-ratelimit-remaining');
    const resetHeader = getHeader('x-ratelimit-reset');

    const existing = this.tokenQuotas.get(token) ?? {
      limit: 5000,
      remaining: 5000,
      resetTime: 0,
    };

    if (limitHeader) {
      const parsedLimit = parseInt(limitHeader, 10);
      if (!isNaN(parsedLimit)) existing.limit = parsedLimit;
    }
    if (remainingHeader) {
      const parsedRemaining = parseInt(remainingHeader, 10);
      if (!isNaN(parsedRemaining)) existing.remaining = parsedRemaining;
    }
    if (resetHeader) {
      const parsedReset = parseInt(resetHeader, 10);
      if (!isNaN(parsedReset)) existing.resetTime = parsedReset * 1000;
    }

    this.tokenQuotas.set(token, existing);
  }

  /**
   * Updates quota manually for a specific token (useful for mocking/testing).
   */
  public setQuota(
    limit: number,
    remaining: number,
    resetTimeMs: number,
    token: string = '__default__'
  ): void {
    this.tokenQuotas.set(token, { limit, remaining, resetTime: resetTimeMs });
  }

  /**
   * Returns aggregate quota information across all tracked tokens, plus the
   * worst-case (minimum remaining ratio) token's state for visibility.
   */
  public getQuota() {
    const states = Array.from(this.tokenQuotas.values());
    if (states.length === 0) {
      return { limit: 5000, remaining: 5000, resetTime: 0, totalRefreshes: this.totalRefreshes };
    }

    const worst = states.reduce((min, s) =>
      s.remaining / Math.max(1, s.limit) < min.remaining / Math.max(1, min.limit) ? s : min
    );

    return {
      limit: worst.limit,
      remaining: worst.remaining,
      resetTime: worst.resetTime,
      totalRefreshes: this.totalRefreshes,
    };
  }

  /**
   * Returns aggregate quota summary across all tracked tokens.
   * Values are masked for security — only aggregate sums and counts are exposed.
   */
  public getAggregateQuota() {
    const states = Array.from(this.tokenQuotas.values());
    const tokenCount = this.tokenQuotas.size;

    if (tokenCount === 0) {
      return {
        totalTokens: 1,
        activeTokens: 1,
        aggregateLimit: 5000,
        aggregateRemaining: 5000,
        lowestRemainingPercent: 100,
        totalRefreshes: this.totalRefreshes,
      };
    }

    const aggregateLimit = states.reduce((sum, s) => sum + s.limit, 0);
    const aggregateRemaining = states.reduce((sum, s) => sum + s.remaining, 0);
    const now = Date.now();
    const activeTokens = states.filter((s) => s.remaining > 0 && s.resetTime > now).length;
    const lowestPercent = Math.min(
      ...states.map((s) => (s.limit > 0 ? (s.remaining / s.limit) * 100 : 0))
    );

    return {
      totalTokens: tokenCount,
      activeTokens,
      aggregateLimit,
      aggregateRemaining,
      lowestRemainingPercent: Math.round(lowestPercent * 100) / 100,
      totalRefreshes: this.totalRefreshes,
    };
  }

  public incrementRefreshCount(): void {
    this.totalRefreshes++;
  }

  /**
   * Returns true if ANY currently-tracked token's remaining quota is below
   * 10% of its limit. Conservative by design: refresh operations are
   * blocked globally if even one pooled token is close to exhaustion,
   * since fetchWithRetry's round-robin could route the next request to it.
   */
  public isQuotaLow(): boolean {
    for (const state of this.tokenQuotas.values()) {
      if (state.remaining < state.limit * 0.1) {
        return true;
      }
    }
    return false;
  }

  public reset(): void {
    this.tokenQuotas.clear();
    this.totalRefreshes = 0;
  }
}

export const quotaMonitor = QuotaMonitor.getInstance();
export default quotaMonitor;
