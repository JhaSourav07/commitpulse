// services/github/quota-monitor.accessibility.test.ts

import { beforeEach, describe, expect, it } from 'vitest';
import { quotaMonitor } from './quota-monitor';

describe('QuotaMonitor Accessibility & State Visibility', () => {
  beforeEach(() => {
    quotaMonitor.reset();
  });

  it('exposes quota information in a readable structure', () => {
    const quota = quotaMonitor.getQuota();

    expect(quota).toHaveProperty('limit');
    expect(quota).toHaveProperty('remaining');
    expect(quota).toHaveProperty('resetTime');
    expect(quota).toHaveProperty('totalRefreshes');
  });

  it('updates quota values from standard GitHub rate limit headers', () => {
    quotaMonitor.updateQuotaFromHeaders({
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '1234',
      'x-ratelimit-reset': '1000',
    });

    const quota = quotaMonitor.getQuota();

    expect(quota.limit).toBe(5000);
    expect(quota.remaining).toBe(1234);
    expect(quota.resetTime).toBe(1000000);
  });

  it('maintains logical state hierarchy after manual quota updates', () => {
    quotaMonitor.setQuota(100, 50, 123456);

    const quota = quotaMonitor.getQuota();

    expect(quota.limit).toBe(100);
    expect(quota.remaining).toBe(50);
    expect(quota.resetTime).toBe(123456);
  });

  it('tracks refresh counts for status visibility', () => {
    quotaMonitor.incrementRefreshCount();
    quotaMonitor.incrementRefreshCount();

    const quota = quotaMonitor.getQuota();

    expect(quota.totalRefreshes).toBe(2);
  });

  it('flags low quota state correctly for user-facing warnings', () => {
    quotaMonitor.setQuota(100, 5, Date.now());

    expect(quotaMonitor.isQuotaLow()).toBe(true);

    quotaMonitor.setQuota(100, 50, Date.now());

    expect(quotaMonitor.isQuotaLow()).toBe(false);
  });
});
