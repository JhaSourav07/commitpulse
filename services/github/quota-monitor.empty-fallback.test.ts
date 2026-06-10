import { describe, it, expect, beforeEach } from 'vitest';
import { QuotaMonitor } from './quota-monitor';

describe('QuotaMonitor Empty Fallback and Edge Cases', () => {
  let monitor: QuotaMonitor;

  beforeEach(() => {
    monitor = QuotaMonitor.getInstance();
    monitor.reset();
  });

  it('verifies that the initial quota state starts with default values', () => {
    const quota = monitor.getQuota();
    expect(quota.limit).toBe(5000);
    expect(quota.remaining).toBe(5000);
    expect(quota.resetTime).toBe(0);
    expect(quota.totalRefreshes).toBe(0);
  });

  it('handles completely empty headers object without crashing or changing defaults', () => {
    monitor.updateQuotaFromHeaders({});
    const quota = monitor.getQuota();
    expect(quota.limit).toBe(5000);
    expect(quota.remaining).toBe(5000);
    expect(quota.resetTime).toBe(0);
  });

  it('handles empty Headers instance gracefully', () => {
    const emptyHeaders = new Headers();
    monitor.updateQuotaFromHeaders(emptyHeaders);
    const quota = monitor.getQuota();
    expect(quota.limit).toBe(5000);
    expect(quota.remaining).toBe(5000);
    expect(quota.resetTime).toBe(0);
  });

  it('ignores malformed non-numeric values in headers gracefully', () => {
    monitor.updateQuotaFromHeaders({
      'x-ratelimit-limit': 'invalid-number',
      'x-ratelimit-remaining': 'abc',
      'x-ratelimit-reset': 'xyz',
    });
    const quota = monitor.getQuota();
    expect(quota.limit).toBe(5000);
    expect(quota.remaining).toBe(5000);
    expect(quota.resetTime).toBe(0);
  });

  it('handles lowercase keys correctly on plain object and uppercase keys in Headers class', () => {
    // 1. Lowercase plain object
    monitor.updateQuotaFromHeaders({
      'x-ratelimit-limit': '1000',
      'x-ratelimit-remaining': '950',
      'x-ratelimit-reset': '1600000000',
    });
    let quota = monitor.getQuota();
    expect(quota.limit).toBe(1000);
    expect(quota.remaining).toBe(950);
    expect(quota.resetTime).toBe(1600000000000);

    // 2. Case-insensitive Headers instance
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', '2000');
    headers.set('X-RateLimit-Remaining', '1900');
    headers.set('X-RateLimit-Reset', '1700000000');
    monitor.updateQuotaFromHeaders(headers);
    quota = monitor.getQuota();
    expect(quota.limit).toBe(2000);
    expect(quota.remaining).toBe(1900);
    expect(quota.resetTime).toBe(1700000000000);
  });
});
