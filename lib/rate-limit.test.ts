import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit, RateLimiter } from './rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests within the limit', async () => {
    const ip = '1.2.3.4';
    for (let i = 0; i < 60; i++) {
      const result = await rateLimit(ip, 60, 60000);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(60 - (i + 1));
    }
  });

  it('blocks requests exceeding the limit', async () => {
    const ip = '2.3.4.5';
    // Consume 60 requests
    for (let i = 0; i < 60; i++) {
      await rateLimit(ip, 60, 60000);
    }

    // 61st request should fail
    const result = await rateLimit(ip, 60, 60000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after the window expires', async () => {
    const ip = '3.4.5.6';
    const windowMs = 60000;

    // Consume all requests
    for (let i = 0; i < 60; i++) {
      await rateLimit(ip, 60, windowMs);
    }

    expect((await rateLimit(ip, 60, windowMs)).success).toBe(false);

    // Fast-forward time
    vi.advanceTimersByTime(windowMs + 1);

    const result = await rateLimit(ip, 60, windowMs);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(59);
  });

  it('does not reset the window TTL on each request (fixed window)', async () => {
    const ip = '4.5.6.7';
    const windowMs = 60000;
    const limit = 5;

    // Make 3 requests spread across the window
    await rateLimit(ip, limit, windowMs);
    vi.advanceTimersByTime(20000);
    await rateLimit(ip, limit, windowMs);
    vi.advanceTimersByTime(20000);
    await rateLimit(ip, limit, windowMs);

    // Advance past original window start (60s from first request)
    // If TTL was resetting, the window would still be open; it should now be closed
    vi.advanceTimersByTime(21000); // total: 61s from first request

    // Window should have expired — count resets
    const result = await rateLimit(ip, limit, windowMs);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(limit - 1);
  });

  it('expires at the window boundary after sliding requests', async () => {
    const ip = '7.7.7.7';
    const windowMs = 60000;
    const limit = 3;

    vi.setSystemTime(0);
    await rateLimit(ip, limit, windowMs);
    vi.advanceTimersByTime(20000);
    await rateLimit(ip, limit, windowMs);
    vi.advanceTimersByTime(20000);
    await rateLimit(ip, limit, windowMs);

    // Still within the same fixed window, before the boundary
    vi.advanceTimersByTime(19999);
    expect((await rateLimit(ip, limit, windowMs)).success).toBe(false);

    // Move just past the window limit. The old entry should have expired.
    vi.advanceTimersByTime(2);

    const result = await rateLimit(ip, limit, windowMs);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(limit - 1);
  });

  it('tracks different IPs separately', async () => {
    const ip1 = '11.11.11.11';
    const ip2 = '22.22.22.22';

    // Consume all requests for ip1
    for (let i = 0; i < 60; i++) {
      await rateLimit(ip1, 60, 60000);
    }

    expect((await rateLimit(ip1, 60, 60000)).success).toBe(false);
    expect((await rateLimit(ip2, 60, 60000)).success).toBe(true);
  });
});

it('keys expire exactly at the window limit with sliding time advances', async () => {
  vi.useFakeTimers();
  const ip = '9.9.9.9';
  const windowMs = 1000;
  const limit = 5;

  // First request: creates the tracker with 1s TTL
  let res = await rateLimit(ip, limit, windowMs);
  expect(res.success).toBe(true);
  expect(res.remaining).toBe(limit - 1);

  // Advance half the window and make another request
  vi.advanceTimersByTime(500);
  res = await rateLimit(ip, limit, windowMs);
  expect(res.success).toBe(true);

  // Advance to exactly the original window boundary (total = 1000ms)
  vi.advanceTimersByTime(500);

  // At the exact boundary the entry should still be considered valid
  res = await rateLimit(ip, limit, windowMs);
  expect(res.success).toBe(true);

  // Move just past the window expiry
  vi.advanceTimersByTime(1);

  // Now the key must have expired and a fresh window starts
  res = await rateLimit(ip, limit, windowMs);
  expect(res.success).toBe(true);
  expect(res.remaining).toBe(limit - 1);
});

it('allows requests after many expired IP entries', async () => {
  const windowMs = 1000;

  for (let i = 0; i < 2001; i++) {
    await rateLimit(`192.168.1.${i}`, 60, windowMs);
  }

  vi.advanceTimersByTime(windowMs + 1);

  const result = await rateLimit('10.0.0.1', 60, windowMs);

  expect(result.success).toBe(true);
});

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests within the limit', async () => {
    // Each check() within the limit should return true
    const limiter = new RateLimiter(3, 60000);
    expect(await limiter.check('1.1.1.1')).toBe(true);
    expect(await limiter.check('1.1.1.1')).toBe(true);
    expect(await limiter.check('1.1.1.1')).toBe(true);
  });

  it('blocks requests after exceeding the limit', async () => {
    // 4th request should be denied when limit is 3
    const limiter = new RateLimiter(3, 60000);
    await limiter.check('2.2.2.2');
    await limiter.check('2.2.2.2');
    await limiter.check('2.2.2.2');
    expect(await limiter.check('2.2.2.2')).toBe(false);
  });

  it('tracks multiple IPs independently', async () => {
    // Exhausting one IP's limit should not affect another IP
    const limiter = new RateLimiter(2, 60000);
    await limiter.check('3.3.3.3');
    await limiter.check('3.3.3.3');
    expect(await limiter.check('3.3.3.3')).toBe(false);
    expect(await limiter.check('4.4.4.4')).toBe(true);
  });

  it('allows requests again after the window resets', async () => {
    // TTL expiry should clear the count, allowing the IP through again
    const windowMs = 60000;
    const limiter = new RateLimiter(2, windowMs);
    await limiter.check('5.5.5.5');
    await limiter.check('5.5.5.5');
    expect(await limiter.check('5.5.5.5')).toBe(false);

    vi.advanceTimersByTime(windowMs + 1);

    expect(await limiter.check('5.5.5.5')).toBe(true);
  });

  it('reset() clears the rate-limited counter for an IP', async () => {
    const limiter = new RateLimiter(2, 60000);

    await limiter.check('7.7.7.7');
    await limiter.check('7.7.7.7');
    expect(await limiter.check('7.7.7.7')).toBe(false); // blocked

    await limiter.reset('7.7.7.7');
    expect(await limiter.check('7.7.7.7')).toBe(true); // unblocked after reset
  });

  it('does not reset the window TTL on each request (fixed window)', async () => {
    const windowMs = 60000;
    const limiter = new RateLimiter(5, windowMs);
    const ip = '6.6.6.6';

    // Make 3 requests spread across the window
    await limiter.check(ip);
    vi.advanceTimersByTime(20000);
    await limiter.check(ip);
    vi.advanceTimersByTime(20000);
    await limiter.check(ip);

    // Advance past original window start (60s from first request)
    vi.advanceTimersByTime(21000); // total: 61s from first request

    // Window should have expired — count resets, request is allowed
    expect(await limiter.check(ip)).toBe(true);
  });

  it('reset() clears the counter and restores the full request allowance', async () => {
    // Verifies that reset() uses the correct cache key (raw IP) so the
    // rate limit state is actually deleted and subsequent requests succeed.
    const limiter = new RateLimiter(3, 60000);
    const ip = '7.7.7.7';

    // Exhaust the limit
    await limiter.check(ip);
    await limiter.check(ip);
    await limiter.check(ip);
    expect(await limiter.check(ip)).toBe(false);

    // Reset should clear the counter
    await limiter.reset(ip);

    // After reset, remaining should be back to the full limit
    expect(await limiter.remaining(ip)).toBe(3);

    // And requests should be allowed again
    expect(await limiter.check(ip)).toBe(true);
    expect(await limiter.remaining(ip)).toBe(2);
  });
});
