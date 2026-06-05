import { beforeEach, describe, expect, it } from 'vitest';
import quotaMonitor, { QuotaMonitor } from './quota-monitor';

describe('QuotaMonitor massive scaling stability', () => {
  beforeEach(() => {
    quotaMonitor.reset();
  });

  it('handles massive quota header values without breaking state', () => {
    const headers = {
      'x-ratelimit-limit': '1000000000',
      'x-ratelimit-remaining': '999999999',
      'x-ratelimit-reset': '9999999999',
    };

    quotaMonitor.updateQuotaFromHeaders(headers);

    expect(quotaMonitor.getQuota()).toEqual({
      limit: 1000000000,
      remaining: 999999999,
      resetTime: 9999999999 * 1000,
      totalRefreshes: 0,
    });
  });

  it('handles thousands of refresh count increments efficiently', () => {
    const start = performance.now();

    for (let i = 0; i < 10_000; i++) {
      quotaMonitor.incrementRefreshCount();
    }

    const duration = performance.now() - start;
    const quota = quotaMonitor.getQuota();

    expect(quota.totalRefreshes).toBe(10_000);
    expect(duration).toBeLessThan(1000);
  });

  it('keeps quota low calculation stable with extreme high bounds', () => {
    quotaMonitor.setQuota(Number.MAX_SAFE_INTEGER, 1, Date.now());

    const quota = quotaMonitor.getQuota();

    expect(Number.isFinite(quota.limit)).toBe(true);
    expect(Number.isFinite(quota.remaining)).toBe(true);
    expect(Number.isFinite(quota.resetTime)).toBe(true);
    expect(quotaMonitor.isQuotaLow()).toBe(true);
  });

  it('does not overflow or corrupt state with massive mocked contributor actions', () => {
    const contributorActions = Array.from({ length: 25_000 }, (_, index) => ({
      username: `contributor-${index}`,
      commits: index + 1,
      pullRequests: index % 50,
      reviews: index % 20,
    }));

    const totalActivity = contributorActions.reduce(
      (total, action) => total + action.commits + action.pullRequests + action.reviews,
      0
    );

    quotaMonitor.setQuota(totalActivity, Math.floor(totalActivity * 0.75), Date.now() + 60_000);

    const quota = quotaMonitor.getQuota();

    expect(contributorActions).toHaveLength(25_000);
    expect(Number.isFinite(totalActivity)).toBe(true);
    expect(quota.limit).toBe(totalActivity);
    expect(quota.remaining).toBe(Math.floor(totalActivity * 0.75));
    expect(quotaMonitor.isQuotaLow()).toBe(false);
  });

  it('returns the same singleton instance for high-volume access patterns', () => {
    const instances = Array.from({ length: 5_000 }, () => QuotaMonitor.getInstance());

    expect(instances.every((instance) => instance === quotaMonitor)).toBe(true);
  });
});
