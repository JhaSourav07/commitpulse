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
    const futureResetTime = Date.now() + 60_000;
    monitor.setQuota(5000, 499, futureResetTime);

    expect(monitor.isQuotaLow()).toBe(true);

    monitor.setQuota(5000, 500, futureResetTime);

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

  it('tracks quota per-token instead of conflating multiple tokens into one global state', () => {
    monitor.updateQuotaFromHeaders(
      { 'x-ratelimit-limit': '5000', 'x-ratelimit-remaining': '50' },
      'token-A-near-exhausted'
    );
    expect(monitor.isQuotaLow()).toBe(true);

    monitor.updateQuotaFromHeaders(
      { 'x-ratelimit-limit': '5000', 'x-ratelimit-remaining': '4990' },
      'token-B-healthy'
    );

    // Token A's near-exhausted state must NOT be overwritten by Token B's
    // healthy response. isQuotaLow() must remain true since Token A could
    // be selected again on the next round-robin request.
    expect(monitor.isQuotaLow()).toBe(true);
  });

  it('reports quota as healthy only when every tracked token has sufficient quota', () => {
    monitor.updateQuotaFromHeaders(
      { 'x-ratelimit-limit': '5000', 'x-ratelimit-remaining': '4990' },
      'token-A'
    );
    monitor.updateQuotaFromHeaders(
      { 'x-ratelimit-limit': '5000', 'x-ratelimit-remaining': '4500' },
      'token-B'
    );

    expect(monitor.isQuotaLow()).toBe(false);
  });
});

describe('[Bug fix] QuotaMonitor.isQuotaLow() — resetTime awareness', () => {
  let monitor: QuotaMonitor;

  beforeEach(() => {
    monitor = QuotaMonitor.getInstance();
    monitor.reset();
  });

  it('does NOT report quota low for a token whose resetTime has already passed', () => {
    monitor.setQuota(5000, 100, Date.now() - 60_000, 'token-A'); // reset 1 minute ago
    expect(monitor.isQuotaLow()).toBe(false);
  });

  it('DOES report quota low for a token that is genuinely exhausted and not yet reset', () => {
    monitor.setQuota(5000, 100, Date.now() + 60_000, 'token-A'); // resets 1 minute from now
    expect(monitor.isQuotaLow()).toBe(true);
  });

  it('still reports quota low if a DIFFERENT token in the pool is genuinely exhausted', () => {
    monitor.setQuota(5000, 100, Date.now() - 60_000, 'token-A'); // stale, already reset
    monitor.setQuota(5000, 200, Date.now() + 60_000, 'token-B'); // genuinely low, not yet reset
    expect(monitor.isQuotaLow()).toBe(true);
  });

  it('treats a token with resetTime=0 (never updated from real headers) normally', () => {
    monitor.setQuota(5000, 100, 0, 'token-A');
    expect(monitor.isQuotaLow()).toBe(true); // 100 < 500, and resetTime=0 shouldn't be skipped
  });
});
