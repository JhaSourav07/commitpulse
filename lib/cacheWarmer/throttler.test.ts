import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Throttler } from './throttler';

describe('Throttler', () => {
  let throttler: Throttler;

  beforeEach(() => {
    throttler = new Throttler([
      'ghp_token111111111111111111111111111111',
      'ghp_token222222222222222222222222222222',
    ]);
  });

  it('rotates tokens and processes users with custom warm function', async () => {
    const warmed: { user: string; token?: string }[] = [];
    const customWarmFn = vi.fn().mockImplementation(async (username, token) => {
      warmed.push({ user: username, token });
    });

    await throttler.warmWithThrottling(['user1', 'user2', 'user3'], {
      concurrency: 2,
      customWarmFn,
    });

    expect(customWarmFn).toHaveBeenCalledTimes(3);
    expect(warmed).toHaveLength(3);
    expect(warmed.map((w) => w.user)).toEqual(expect.arrayContaining(['user1', 'user2', 'user3']));
  });

  it('retries with backoff on failure', async () => {
    let calls = 0;
    const customWarmFn = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls === 1) {
        throw new Error('429 Rate Limit Exceeded');
      }
    });

    await throttler.warmWithThrottling(['user1'], {
      maxRetries: 2,
      customWarmFn,
    });

    expect(customWarmFn).toHaveBeenCalledTimes(2);
  });

  it('returns correct token pool size', () => {
    expect(throttler.getTokenPoolSize()).toBe(2);
  });
});
