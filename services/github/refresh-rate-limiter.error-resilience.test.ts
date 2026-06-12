// services/github/refresh-rate-limiter.error-resilience.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { refreshRateLimiter } from './refresh-rate-limiter';

describe('RefreshRateLimiter Error Resilience', () => {
  const originalEnv = process.env.MAX_REFRESHES_PER_HOUR;

  beforeEach(() => {
    refreshRateLimiter.reset();
    delete process.env.MAX_REFRESHES_PER_HOUR;
  });

  afterEach(() => {
    refreshRateLimiter.reset();

    if (originalEnv) {
      process.env.MAX_REFRESHES_PER_HOUR = originalEnv;
    } else {
      delete process.env.MAX_REFRESHES_PER_HOUR;
    }
  });

  it('falls back to default limit when environment value is invalid', () => {
    process.env.MAX_REFRESHES_PER_HOUR = 'invalid';

    const result = refreshRateLimiter.checkLimit('127.0.0.1');

    expect(result.success).toBe(true);
    expect(result.limit).toBe(3);
    expect(result.remaining).toBe(2);
  });

  it('falls back to default limit when environment value is zero', () => {
    process.env.MAX_REFRESHES_PER_HOUR = '0';

    const result = refreshRateLimiter.checkLimit('127.0.0.1');

    expect(result.success).toBe(true);
    expect(result.limit).toBe(3);
  });

  it('handles malformed or whitespace-only client identifiers safely', () => {
    const result = refreshRateLimiter.checkLimit('   ');

    expect(result.success).toBe(true);
    expect(result.limit).toBe(3);
    expect(result.remaining).toBe(2);
  });

  it('recovers correctly after reset is called', () => {
    refreshRateLimiter.setLimit(1);

    expect(refreshRateLimiter.checkLimit('192.168.1.1').success).toBe(true);

    expect(refreshRateLimiter.checkLimit('192.168.1.1').success).toBe(false);

    refreshRateLimiter.reset();

    const result = refreshRateLimiter.checkLimit('192.168.1.1');

    expect(result.success).toBe(true);
    expect(result.limit).toBe(3);
    expect(result.remaining).toBe(2);
  });

  it('maintains stable behavior across repeated checks after limit exhaustion', () => {
    refreshRateLimiter.setLimit(1);

    expect(refreshRateLimiter.checkLimit('10.0.0.1').success).toBe(true);

    const blocked1 = refreshRateLimiter.checkLimit('10.0.0.1');
    const blocked2 = refreshRateLimiter.checkLimit('10.0.0.1');

    expect(blocked1.success).toBe(false);
    expect(blocked2.success).toBe(false);

    expect(blocked1.remaining).toBe(0);
    expect(blocked2.remaining).toBe(0);
  });
});
