import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit } from './rate-limit';
import { RateLimiter } from './rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests within the limit', () => {
    const ip = '1.2.3.4';
    for (let i = 0; i < 60; i++) {
      const result = rateLimit(ip, 60, 60000);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(60 - (i + 1));
    }
  });

  it('blocks requests exceeding the limit', () => {
    const ip = '2.3.4.5';
    // Consume 60 requests
    for (let i = 0; i < 60; i++) {
      rateLimit(ip, 60, 60000);
    }

    // 61st request should fail
    const result = rateLimit(ip, 60, 60000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after the window expires', () => {
    const ip = '3.4.5.6';
    const windowMs = 60000;

    // Consume all requests
    for (let i = 0; i < 60; i++) {
      rateLimit(ip, 60, windowMs);
    }

    expect(rateLimit(ip, 60, windowMs).success).toBe(false);

    // Fast-forward time
    vi.advanceTimersByTime(windowMs + 1);

    const result = rateLimit(ip, 60, windowMs);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(59);
  });

  it('tracks different IPs separately', () => {
    const ip1 = '11.11.11.11';
    const ip2 = '22.22.22.22';

    // Consume all requests for ip1
    for (let i = 0; i < 60; i++) {
      rateLimit(ip1, 60, 60000);
    }

    expect(rateLimit(ip1, 60, 60000).success).toBe(false);
    expect(rateLimit(ip2, 60, 60000).success).toBe(true);
  });
});
it('allows requests after many expired IP entries', () => {
  const windowMs = 1000;

  expect(() => {
    for (let i = 0; i < 2001; i++) {
      rateLimit(`192.168.1.${i}`, 60, windowMs);
    }
  }).not.toThrow();

  vi.advanceTimersByTime(windowMs + 1);

  const result = rateLimit('10.0.0.1', 60, windowMs);

  expect(result.success).toBe(true);
});

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests within the limit', () => {
    // Each check() within the limit should return true
    const limiter = new RateLimiter(3, 60000);
    expect(limiter.check('1.1.1.1')).toBe(true);
    expect(limiter.check('1.1.1.1')).toBe(true);
    expect(limiter.check('1.1.1.1')).toBe(true);
  });

  it('blocks requests after exceeding the limit', () => {
    // 4th request should be denied when limit is 3
    const limiter = new RateLimiter(3, 60000);
    limiter.check('2.2.2.2');
    limiter.check('2.2.2.2');
    limiter.check('2.2.2.2');
    expect(limiter.check('2.2.2.2')).toBe(false);
  });

  it('tracks multiple IPs independently', () => {
    // Exhausting one IP's limit should not affect another IP
    const limiter = new RateLimiter(2, 60000);
    limiter.check('3.3.3.3');
    limiter.check('3.3.3.3');
    expect(limiter.check('3.3.3.3')).toBe(false);
    expect(limiter.check('4.4.4.4')).toBe(true);
  });

  it('allows requests again after the window resets', () => {
    // TTL expiry should clear the count, allowing the IP through again
    const windowMs = 60000;
    const limiter = new RateLimiter(2, windowMs);
    limiter.check('5.5.5.5');
    limiter.check('5.5.5.5');
    expect(limiter.check('5.5.5.5')).toBe(false);

    vi.advanceTimersByTime(windowMs + 1);

    expect(limiter.check('5.5.5.5')).toBe(true);
  });
});
