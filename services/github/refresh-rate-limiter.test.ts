import { beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshRateLimiter } from './refresh-rate-limiter';

describe('RefreshRateLimiter', () => {
  beforeEach(() => {
    refreshRateLimiter.reset();
    delete process.env.MAX_REFRESHES_PER_HOUR;
    vi.restoreAllMocks();
  });

  it('allows the initial refresh request from an IP', () => {
    const result = refreshRateLimiter.checkLimit('127.0.0.1');

    expect(result.success).toBe(true);
    expect(result.limit).toBe(3);
    expect(result.remaining).toBe(2);
  });

  it('blocks requests after the limit is reached within the same window', () => {
    refreshRateLimiter.setLimit(3);

    refreshRateLimiter.checkLimit('127.0.0.1');
    refreshRateLimiter.checkLimit('127.0.0.1');
    refreshRateLimiter.checkLimit('127.0.0.1');

    const blocked = refreshRateLimiter.checkLimit('127.0.0.1');

    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.limit).toBe(3);
  });

  it('resets the limit after the cooldown window expires', () => {
    vi.useFakeTimers();

    refreshRateLimiter.setLimit(2, 1000);

    refreshRateLimiter.checkLimit('127.0.0.1');
    refreshRateLimiter.checkLimit('127.0.0.1');

    expect(refreshRateLimiter.checkLimit('127.0.0.1').success).toBe(false);

    vi.advanceTimersByTime(1001);

    const result = refreshRateLimiter.checkLimit('127.0.0.1');

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);

    vi.useRealTimers();
  });

  it('returns correct reset timestamp information', () => {
    vi.useFakeTimers();

    const now = new Date('2025-01-01T00:00:00Z');
    vi.setSystemTime(now);

    refreshRateLimiter.setLimit(3, 60_000);

    const result = refreshRateLimiter.checkLimit('127.0.0.1');

    expect(result.reset).toBe(now.getTime() + 60_000);

    vi.useRealTimers();
  });

  it('uses MAX_REFRESHES_PER_HOUR environment override', () => {
    process.env.MAX_REFRESHES_PER_HOUR = '5';

    refreshRateLimiter.reset();

    const result = refreshRateLimiter.checkLimit('127.0.0.1');

    expect(result.limit).toBe(5);
    expect(result.remaining).toBe(4);
  });
});
