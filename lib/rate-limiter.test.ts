// lib/rate-limiter.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the limit', () => {
    const limiter = new RateLimiter(3, 10000);
    expect(limiter.isLimitExceeded('ip1')).toBe(false);
    expect(limiter.isLimitExceeded('ip1')).toBe(false);
    expect(limiter.isLimitExceeded('ip1')).toBe(false);
  });

  it('blocks requests exceeding the limit', () => {
    const limiter = new RateLimiter(2, 10000);
    expect(limiter.isLimitExceeded('ip1')).toBe(false);
    expect(limiter.isLimitExceeded('ip1')).toBe(false);
    expect(limiter.isLimitExceeded('ip1')).toBe(true);
  });

  it('does not leak limits across different keys', () => {
    const limiter = new RateLimiter(2, 10000);
    expect(limiter.isLimitExceeded('ip1')).toBe(false);
    expect(limiter.isLimitExceeded('ip1')).toBe(false);
    expect(limiter.isLimitExceeded('ip1')).toBe(true);

    expect(limiter.isLimitExceeded('ip2')).toBe(false);
  });

  it('allows requests again after window elapsed', () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter(2, 10000);
    expect(limiter.isLimitExceeded('ip1')).toBe(false);
    expect(limiter.isLimitExceeded('ip1')).toBe(false);
    expect(limiter.isLimitExceeded('ip1')).toBe(true);

    vi.advanceTimersByTime(11000);

    expect(limiter.isLimitExceeded('ip1')).toBe(false);
  });

  it('resets request history on clear()', () => {
    const limiter = new RateLimiter(2, 10000);
    expect(limiter.isLimitExceeded('ip1')).toBe(false);
    expect(limiter.isLimitExceeded('ip1')).toBe(false);
    expect(limiter.isLimitExceeded('ip1')).toBe(true);

    limiter.clear();

    expect(limiter.isLimitExceeded('ip1')).toBe(false);
  });
});
