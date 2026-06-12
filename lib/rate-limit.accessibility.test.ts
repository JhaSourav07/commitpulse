import { describe, expect, it } from 'vitest';
import { RateLimiter, rateLimit } from './rate-limit';

describe('rate-limit accessibility compliance', () => {
  it('should return a complete result structure for screen-reader consumers', async () => {
    const limiter = new RateLimiter(5, 60000);

    const result = await limiter.checkWithResult('127.0.0.1');

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('limit');
    expect(result).toHaveProperty('remaining');
    expect(result).toHaveProperty('reset');
  });

  it('should expose numeric metadata suitable for accessibility announcements', async () => {
    const limiter = new RateLimiter(5, 60000);

    const result = await limiter.checkWithResult('127.0.0.2');

    expect(typeof result.limit).toBe('number');
    expect(typeof result.remaining).toBe('number');
    expect(typeof result.reset).toBe('number');
  });

  it('should provide consistent feedback for allowlisted users', async () => {
    const limiter = new RateLimiter(5, 60000);

    limiter.allow('allow-ip');

    const result = await limiter.checkWithResult('allow-ip');

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(result.limit);
  });

  it('should provide consistent feedback for blocklisted users', async () => {
    const limiter = new RateLimiter(5, 60000);

    limiter.block('blocked-ip');

    const result = await limiter.checkWithResult('blocked-ip');

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should return accessible rate-limit information from helper function', async () => {
    const result = await rateLimit('helper-ip', 3, 60000);

    expect(result).toMatchObject({
      success: expect.any(Boolean),
      limit: expect.any(Number),
      remaining: expect.any(Number),
      reset: expect.any(Number),
    });
  });
});
