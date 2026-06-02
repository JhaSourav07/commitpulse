import { describe, it, expect, beforeEach } from 'vitest';
import { QuotaMonitor } from './quota-monitor';

describe('QuotaMonitor', () => {
  let monitor: QuotaMonitor;

  beforeEach(() => {
    monitor = QuotaMonitor.getInstance();
    monitor.reset();
  });

  it('parses X-RateLimit headers correctly', () => {
    monitor.updateQuotaFromHeaders({
      'x-ratelimit-limit': '5000',
      'x-ratelimit-remaining': '4200',
      'x-ratelimit-reset': '1710000000',
    });

    const quota = monitor.getQuota();

    expect(quota.limit).toBe(5000);
    expect(quota.remaining).toBe(4200);
  });

  it('calculates remaining API credits correctly', () => {
    monitor.setQuota(5000, 1234, Date.now());

    const quota = monitor.getQuota();

    expect(quota.limit).toBe(5000);
    expect(quota.remaining).toBe(1234);
  });

  it('flags quota as low when remaining credits are below 10%', () => {
    monitor.setQuota(5000, 499, Date.now());

    expect(monitor.isQuotaLow()).toBe(true);

    monitor.setQuota(5000, 500, Date.now());

    expect(monitor.isQuotaLow()).toBe(false);
  });

  it('tracks refresh operations correctly', () => {
    monitor.incrementRefreshCount();
    monitor.incrementRefreshCount();
    monitor.incrementRefreshCount();

    expect(monitor.getQuota().totalRefreshes).toBe(3);
  });

  it('parses reset window timestamps into milliseconds', () => {
    monitor.updateQuotaFromHeaders({
      'x-ratelimit-reset': '1710000000',
    });

    expect(monitor.getQuota().resetTime).toBe(1710000000 * 1000);
  });
});
