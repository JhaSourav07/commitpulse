import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, RateLimiter } from './rate-limit';

describe('rate-limit massive data sets and extreme high bounds scaling', () => {
  beforeEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  it('handles 5,000 unique IP addresses without memory overflow or degradation', async () => {
    const limiter = new RateLimiter(10, 60000, 10000);
    const startTime = performance.now();

    for (let i = 0; i < 5000; i++) {
      const ip = `10.${i >> 8}.${i & 255}.1`;
      const result = await limiter.checkWithResult(ip);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;
    expect(executionTime).toBeLessThan(2000);
  });

  it('correctly exhausts a high-bound limit of 10,000 requests from a single IP', async () => {
    const ip = '192.168.1.1';
    const limit = 10000;
    const windowMs = 60000;
    const startTime = performance.now();

    for (let i = 0; i < 10000; i++) {
      const result = await rateLimit(ip, limit, windowMs);
      expect(result.success).toBe(true);
      if (i === 0 || i === 4999 || i === 9999) {
        expect(result.remaining).toBe(limit - (i + 1));
      }
    }

    const resultExhausted = await rateLimit(ip, limit, windowMs);
    expect(resultExhausted.success).toBe(false);
    expect(resultExhausted.remaining).toBe(0);

    const endTime = performance.now();
    const executionTime = endTime - startTime;
    expect(executionTime).toBeLessThan(3000);
  }, 15000);

  it('maintains valid RateLimitResult structure across 100k unique contributor IPs', async () => {
    const startTime = performance.now();

    for (let i = 0; i < 100000; i++) {
      const ip = `10.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}`;
      const result = await rateLimit(ip, 60, 60000);

      if (i % 1000 === 0) {
        expect(typeof result.success).toBe('boolean');
        expect(result.limit).toBe(60);
        expect(result.remaining).toBeGreaterThanOrEqual(0);
        expect(result.reset).toBeGreaterThan(Date.now() - 1000);
        expect(result.remaining).toBeLessThanOrEqual(result.limit);
      }
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;
    expect(executionTime).toBeLessThan(15000);
  }, 30000);

  it('keeps reset timestamps within safe numeric bounds under extreme window sizes', async () => {
    const extremeWindows = [1, 86400000, 2147483647];
    const ip = '198.51.100.1';

    for (const windowMs of extremeWindows) {
      const result = await rateLimit(ip, 5, windowMs);
      expect(Number.isFinite(result.reset)).toBe(true);
      expect(result.reset).toBeGreaterThan(Date.now() - 1000);
      expect(result.reset).toBeLessThan(Date.now() + windowMs + 1000);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.remaining).toBeLessThanOrEqual(result.limit);
    }
  });

  it('preserves correct success/failure distribution across 50k IPs with allowlist and blocklist', async () => {
    const limiter = new RateLimiter(2, 60000);
    const startTime = performance.now();

    for (let i = 0; i < 1000; i++) {
      limiter.allow(`ip-${i}`);
    }
    for (let i = 1000; i < 2000; i++) {
      limiter.block(`ip-${i}`);
    }

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < 50000; i++) {
      const ip = `ip-${i}`;
      const result = await limiter.checkWithResult(ip);

      if (i < 1000) {
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(2);
      } else if (i < 2000) {
        expect(result.success).toBe(false);
        expect(result.remaining).toBe(0);
      } else {
        if (i === 2000) {
          expect(result.success).toBe(true);
          expect(result.remaining).toBe(1);

          const result2 = await limiter.checkWithResult(ip);
          expect(result2.success).toBe(true);
          expect(result2.remaining).toBe(0);

          const result3 = await limiter.checkWithResult(ip);
          expect(result3.success).toBe(false);
          expect(result3.remaining).toBe(0);

          if (result2.success) successCount++;
          else failureCount++;
          if (result3.success) successCount++;
          else failureCount++;
        } else {
          expect(result.success).toBe(true);
          expect(result.remaining).toBe(1);
        }
      }

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.remaining).toBeLessThanOrEqual(result.limit);
    }

    expect(successCount).toBeGreaterThan(0);
    expect(failureCount).toBeGreaterThanOrEqual(0);

    const endTime = performance.now();
    const executionTime = endTime - startTime;
    expect(executionTime).toBeLessThan(19000);
  }, 20000);
});
