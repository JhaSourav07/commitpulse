// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshRateLimiter } from './refresh-rate-limiter';

const FIXED_NOW = new Date('2026-06-02T00:00:00.000Z').valueOf();

describe('RefreshRateLimiter Empty Fallback Verification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    vi.stubEnv('MAX_REFRESHES_PER_HOUR', 'not-a-number');
    refreshRateLimiter.reset();
  });

  afterEach(() => {
    refreshRateLimiter.reset();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('throws for empty object and empty array runtime payloads', () => {
    expect(() => Reflect.apply(refreshRateLimiter.checkLimit, refreshRateLimiter, [{}])).toThrow(
      TypeError
    );
    expect(() => Reflect.apply(refreshRateLimiter.checkLimit, refreshRateLimiter, [[]])).toThrow(
      TypeError
    );
  });

  it('throws for null and numeric runtime payloads', () => {
    expect(() => Reflect.apply(refreshRateLimiter.checkLimit, refreshRateLimiter, [null])).toThrow(
      TypeError
    );
    expect(() => Reflect.apply(refreshRateLimiter.checkLimit, refreshRateLimiter, [0])).toThrow(
      TypeError
    );
  });

  it('accepts whitespace strings and still returns the default limiter structure', () => {
    const result = refreshRateLimiter.checkLimit('   ');

    expect(result.success).toBe(true);
    expect(result.limit).toBe(3);
    expect(result.remaining).toBe(2);
    expect(result.reset).toBe(FIXED_NOW + 60 * 60 * 1000);
  });

  it('honors a stubbed hourly limit for repeated checks', () => {
    vi.stubEnv('MAX_REFRESHES_PER_HOUR', '2');
    refreshRateLimiter.reset();

    const first = refreshRateLimiter.checkLimit('203.0.113.5');
    const second = refreshRateLimiter.checkLimit('203.0.113.5');
    const third = refreshRateLimiter.checkLimit('203.0.113.5');

    expect(first.success).toBe(true);
    expect(first.limit).toBe(2);
    expect(first.remaining).toBe(1);

    expect(second.success).toBe(true);
    expect(second.limit).toBe(2);
    expect(second.remaining).toBe(0);

    expect(third.success).toBe(false);
    expect(third.limit).toBe(2);
    expect(third.remaining).toBe(0);
  });

  it('resets back to production defaults after a custom limit has been applied', () => {
    refreshRateLimiter.setLimit(1);

    const allowed = refreshRateLimiter.checkLimit('198.51.100.1');
    const blocked = refreshRateLimiter.checkLimit('198.51.100.1');

    expect(allowed.success).toBe(true);
    expect(allowed.limit).toBe(1);
    expect(allowed.remaining).toBe(0);

    expect(blocked.success).toBe(false);
    expect(blocked.limit).toBe(1);
    expect(blocked.remaining).toBe(0);

    refreshRateLimiter.reset();

    const resetResult = refreshRateLimiter.checkLimit('198.51.100.1');

    expect(resetResult.success).toBe(true);
    expect(resetResult.limit).toBe(3);
    expect(resetResult.remaining).toBe(2);
  });
});
