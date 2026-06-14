import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rateLimit, RateLimiter } from './rate-limit';

beforeEach(() => {
  vi.stubEnv('KV_REST_API_URL', '');
  vi.stubEnv('KV_REST_API_TOKEN', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('RateLimiter edge cases and empty inputs', () => {
  it('constructs with no arguments using default limit and window', async () => {
    const limiter = new RateLimiter();
    const remaining = await limiter.remaining('fresh-ip');
    expect(remaining).toBe(5);
  });

  it('rejects empty IP string with a cache key error', async () => {
    await expect(rateLimit('', 60, 60000)).rejects.toThrow(/cache key/i);
  });

  it('returns full limit for remaining before any request is made', async () => {
    const limiter = new RateLimiter(10, 60000);
    const remaining = await limiter.remaining('untracked-ip');
    expect(remaining).toBe(10);
  });

  it('does not throw when resetting an untracked IP', async () => {
    const limiter = new RateLimiter(5, 60000);
    await expect(limiter.reset('never-seen-ip')).resolves.toBeUndefined();
  });

  it('processes IP not in allowlist or blocklist normally', async () => {
    const limiter = new RateLimiter(5, 60000);
    const result = await limiter.check('neutral-ip');
    expect(result).toBe(true);
    const remaining = await limiter.remaining('neutral-ip');
    expect(remaining).toBe(4);
  });
});
