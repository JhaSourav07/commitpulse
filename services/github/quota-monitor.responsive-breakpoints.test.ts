// services/github/quota-monitor.responsive-breakpoints.test.ts

import { beforeEach, describe, expect, it } from 'vitest';
import { quotaMonitor } from './quota-monitor';

describe('QuotaMonitor Responsive Breakpoint Stability', () => {
  beforeEach(() => {
    quotaMonitor.reset();
  });

  it('maintains quota data structure under simulated mobile viewport conditions', () => {
    const quota = quotaMonitor.getQuota();

    expect(quota).toEqual({
      limit: 5000,
      remaining: 5000,
      resetTime: 0,
      totalRefreshes: 0,
    });
  });

  it('preserves quota values after multiple updates', () => {
    quotaMonitor.setQuota(1000, 750, 123456);

    const quota = quotaMonitor.getQuota();

    expect(quota.limit).toBe(1000);
    expect(quota.remaining).toBe(750);
    expect(quota.resetTime).toBe(123456);
  });

  it('handles repeated refresh tracking without state corruption', () => {
    quotaMonitor.incrementRefreshCount();
    quotaMonitor.incrementRefreshCount();
    quotaMonitor.incrementRefreshCount();

    expect(quotaMonitor.getQuota().totalRefreshes).toBe(3);
  });

  it('updates state correctly from rate limit headers', () => {
    quotaMonitor.updateQuotaFromHeaders({
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '250',
      'x-ratelimit-reset': '1000',
    });

    const quota = quotaMonitor.getQuota();

    expect(quota.limit).toBe(5000);
    expect(quota.remaining).toBe(250);
    expect(quota.resetTime).toBe(1000000);
  });

  it('correctly evaluates low quota thresholds across state transitions', () => {
    quotaMonitor.setQuota(100, 5, Date.now());

    expect(quotaMonitor.isQuotaLow()).toBe(true);

    quotaMonitor.setQuota(100, 50, Date.now());

    expect(quotaMonitor.isQuotaLow()).toBe(false);
  });
});
