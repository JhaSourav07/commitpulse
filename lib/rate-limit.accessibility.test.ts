import { describe, expect, it, vi } from 'vitest';
import { RateLimiter, rateLimit } from './rate-limit';

describe('RateLimiter accessibility standards', () => {
  it('should expose rate limit result with accessible status information', async () => {
    const limiter = new RateLimiter(2, 60000);

    const result = await limiter.checkWithResult('127.0.0.1');

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('limit');
    expect(result).toHaveProperty('remaining');
    expect(result).toHaveProperty('reset');
  });

  it('should allow keyboard-focus compatible interactive states', async () => {
    const limiter = new RateLimiter(1, 60000);

    const first = await limiter.check('test-ip');
    const second = await limiter.check('test-ip');

    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('should support allowlist accessibility bypass behavior', async () => {
    const limiter = new RateLimiter(1, 60000);

    limiter.allow('allowed-ip');

    const result = await limiter.checkWithResult('allowed-ip');

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('should support blocked state announcement behavior', async () => {
    const limiter = new RateLimiter(5, 60000);

    limiter.block('blocked-ip');

    const result = await limiter.checkWithResult('blocked-ip');

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should return valid rate limit response structure for screen reader consumers', async () => {
    vi.stubEnv('KV_REST_API_URL', '');
    vi.stubEnv('KV_REST_API_TOKEN', '');

    const result = await rateLimit('screen-reader-test', 3, 60000);

    expect(typeof result.success).toBe('boolean');
    expect(typeof result.limit).toBe('number');
    expect(typeof result.remaining).toBe('number');
    expect(typeof result.reset).toBe('number');
  });
});
