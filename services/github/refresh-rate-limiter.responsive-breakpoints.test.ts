import { beforeEach, describe, expect, it } from 'vitest';
import refreshRateLimiter from './refresh-rate-limiter';

describe('RefreshRateLimiter responsive breakpoints', () => {
  beforeEach(() => {
    refreshRateLimiter.reset();
    delete process.env.MAX_REFRESHES_PER_HOUR;
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));
  });

  it('maintains default limit behavior under a narrow mobile viewport', () => {
    expect(window.innerWidth).toBe(375);

    const response1 = refreshRateLimiter.checkLimit('203.0.113.5');
    expect(response1.success).toBe(true);
    expect(response1.limit).toBe(3);
    expect(response1.remaining).toBe(2);

    const response2 = refreshRateLimiter.checkLimit('203.0.113.5');
    expect(response2.success).toBe(true);
    expect(response2.remaining).toBe(1);
  });

  it('reflows client tracking correctly when the same IP is reused on mobile breakpoints', () => {
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));

    const first = refreshRateLimiter.checkLimit(' 203.0.113.5 ');
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(2);

    const second = refreshRateLimiter.checkLimit('203.0.113.5');
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(1);
    expect(second.limit).toBe(first.limit);
  });

  it('adapts to environment-driven limits while preserving mobile-friendly fallback state', () => {
    process.env.MAX_REFRESHES_PER_HOUR = '2';
    refreshRateLimiter.reset();

    expect(window.innerWidth).toBe(375);

    const first = refreshRateLimiter.checkLimit('198.51.100.1');
    expect(first.success).toBe(true);
    expect(first.limit).toBe(2);
    expect(first.remaining).toBe(1);

    const second = refreshRateLimiter.checkLimit('198.51.100.1');
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(0);
  });

  it('returns a reset timestamp without relying on absolute screen dimensions', () => {
    const response = refreshRateLimiter.checkLimit('198.51.100.2');
    expect(response.reset).toBeGreaterThan(Date.now());
    expect(typeof response.reset).toBe('number');
    expect(response.limit).toBe(3);
  });

  it('enforces the limit and reports blocked refreshes cleanly on simulated mobile width', () => {
    refreshRateLimiter.setLimit(1, 1000 * 60 * 60);
    expect(window.innerWidth).toBe(375);

    const allowed = refreshRateLimiter.checkLimit('203.0.113.10');
    expect(allowed.success).toBe(true);
    expect(allowed.remaining).toBe(0);

    const blocked = refreshRateLimiter.checkLimit('203.0.113.10');
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.limit).toBe(1);
  });
});
