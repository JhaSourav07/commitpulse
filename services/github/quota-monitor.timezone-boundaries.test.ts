import { beforeEach, describe, expect, it } from 'vitest';
import quotaMonitor from './quota-monitor';

describe('QuotaMonitor Timezone Boundaries', () => {
  beforeEach(() => {
    quotaMonitor.reset();
  });

  it('stores UTC midnight reset timestamps correctly', () => {
    const utcMidnight = 1704067200; // 2024-01-01T00:00:00Z

    quotaMonitor.updateQuotaFromHeaders({
      'x-ratelimit-reset': String(utcMidnight),
    });

    expect(quotaMonitor.getQuota().resetTime).toBe(1704067200000);
  });

  it('preserves reset timestamps near EST calendar boundaries', () => {
    const estBoundary = 1704085199;

    quotaMonitor.updateQuotaFromHeaders({
      'x-ratelimit-reset': String(estBoundary),
    });

    expect(quotaMonitor.getQuota().resetTime).toBe(estBoundary * 1000);
  });

  it('updates correctly when moving between IST and JST boundary timestamps', () => {
    const istBoundary = 1704047400;
    const jstBoundary = 1704034800;

    quotaMonitor.updateQuotaFromHeaders({
      'x-ratelimit-reset': String(istBoundary),
    });

    expect(quotaMonitor.getQuota().resetTime).toBe(istBoundary * 1000);

    quotaMonitor.updateQuotaFromHeaders({
      'x-ratelimit-reset': String(jstBoundary),
    });

    expect(quotaMonitor.getQuota().resetTime).toBe(jstBoundary * 1000);
  });

  it('handles leap year reset dates without losing precision', () => {
    const leapYearReset = Math.floor(new Date('2024-02-29T00:00:00Z').getTime() / 1000);

    quotaMonitor.updateQuotaFromHeaders({
      'x-ratelimit-reset': String(leapYearReset),
    });

    expect(quotaMonitor.getQuota().resetTime).toBe(leapYearReset * 1000);
  });

  it('tracks DST transition timestamps while preserving quota state', () => {
    quotaMonitor.updateQuotaFromHeaders({
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '4500',
      'x-ratelimit-reset': '1710054000',
    });

    const quota = quotaMonitor.getQuota();

    expect(quota.limit).toBe(5000);
    expect(quota.remaining).toBe(4500);
    expect(quota.resetTime).toBe(1710054000000);
  });
});
