import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DistributedCache } from './cache';

describe('DistributedCache distributed lock improvements', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    process.env = { ...originalEnv };
    process.env.KV_REST_API_URL = 'https://mock-redis.upstash.io';
    process.env.KV_REST_API_TOKEN = 'mock-token';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  function mockRedisResponse(result: unknown, ok = true) {
    return Promise.resolve({
      ok,
      status: ok ? 200 : 500,
      json: () => Promise.resolve({ result }),
    } as Response);
  }

  it('accepts custom lockTtlMs via LockConfig', async () => {
    const setCalls: string[] = [];
    vi.mocked(fetch).mockImplementation(async (_url, opts) => {
      const body = JSON.parse((opts as RequestInit).body as string);
      const cmd = body[0];
      if (cmd === 'SET' && body[3] === 'NX') {
        setCalls.push(body[4] + body[5]);
        return mockRedisResponse('OK');
      }
      if (cmd === 'EVAL') return mockRedisResponse(1);
      if (cmd === 'SET' && body[3] === 'EX') return mockRedisResponse('OK');
      if (cmd === 'GET') return mockRedisResponse(null);
      return mockRedisResponse(undefined);
    });

    const cache = new DistributedCache<string>();
    await cache.getOrSet('cfg-ttl', async () => 'val', 60_000, undefined, { lockTtlMs: 5000 });

    // The PX value sent to Redis should be 5000
    const pxCall = setCalls.find((c) => c.startsWith('PX'));
    expect(pxCall).toBe('PX5000');
    cache.destroy();
  });

  it('accepts custom maxPollTimeMs via LockConfig and stops polling after timeout', async () => {
    let setNxCalls = 0;
    vi.mocked(fetch).mockImplementation(async (_url, opts) => {
      const body = JSON.parse((opts as RequestInit).body as string);
      // Always respond with nil to SET NX so the lock is never acquired
      if (body[0] === 'SET' && body[3] === 'NX') {
        setNxCalls++;
        return mockRedisResponse(undefined);
      }
      if (body[0] === 'GET') return mockRedisResponse(null);
      if (body[0] === 'EVAL') return mockRedisResponse(0);
      if (body[0] === 'SET') return mockRedisResponse('OK');
      return mockRedisResponse(undefined);
    });

    const cache = new DistributedCache<string>();
    const start = Date.now();
    await cache.getOrSet('poll-timeout', async () => 'fallback', 60_000, undefined, {
      maxPollTimeMs: 500,
    });
    const elapsed = Date.now() - start;

    // Should not have waited the full default 8000ms — our 500ms cap took effect
    expect(elapsed).toBeLessThan(3000);
    // loadFn should have been called (fallback path)
    expect(setNxCalls).toBeGreaterThan(0);
    cache.destroy();
  }, 10000);

  it('releases lock on success and cache is usable afterward', async () => {
    let evalCalls = 0;
    vi.mocked(fetch).mockImplementation(async (_url, opts) => {
      const body = JSON.parse((opts as RequestInit).body as string);
      if (body[0] === 'SET' && body[3] === 'NX') return mockRedisResponse('OK');
      if (body[0] === 'EVAL') {
        evalCalls++;
        return mockRedisResponse(1);
      }
      if (body[0] === 'SET' && body[3] === 'EX') return mockRedisResponse('OK');
      if (body[0] === 'GET') return mockRedisResponse(null);
      return mockRedisResponse(undefined);
    });

    const cache = new DistributedCache<string>();
    const result = await cache.getOrSet('release-test', async () => 'hello', 60_000);
    expect(result).toBe('hello');
    // Lua EVAL called for lock release
    expect(evalCalls).toBe(1);

    // Subsequent getOrSet — cache hit returns the stored value without calling loadFn again
    const result2 = await cache.getOrSet('release-test', async () => 'world', 60_000);
    expect(result2).toBe('hello');
    cache.destroy();
  });

  it('releases lock when loadFn throws and rethrows the error', async () => {
    let evalCalls = 0;
    const loadError = new Error('load failure');
    vi.mocked(fetch).mockImplementation(async (_url, opts) => {
      const body = JSON.parse((opts as RequestInit).body as string);
      if (body[0] === 'SET' && body[3] === 'NX') return mockRedisResponse('OK');
      if (body[0] === 'EVAL') {
        evalCalls++;
        return mockRedisResponse(1);
      }
      if (body[0] === 'GET') return mockRedisResponse(null);
      return mockRedisResponse(undefined);
    });

    const cache = new DistributedCache<string>();
    await expect(
      cache.getOrSet(
        'throw-test',
        async () => {
          throw loadError;
        },
        60_000
      )
    ).rejects.toThrow(loadError);
    // Lock release should have been attempted
    expect(evalCalls).toBe(1);
    cache.destroy();
  });

  it('retries lock release on transient Redis errors', async () => {
    let evalAttempts = 0;
    vi.mocked(fetch).mockImplementation(async (_url, opts) => {
      const body = JSON.parse((opts as RequestInit).body as string);
      if (body[0] === 'SET' && body[3] === 'NX') return mockRedisResponse('OK');
      if (body[0] === 'EVAL') {
        evalAttempts++;
        // Fail the first call, succeed the second
        if (evalAttempts === 1) return Promise.reject(new Error('transient error'));
        return mockRedisResponse(1);
      }
      if (body[0] === 'SET' && body[3] === 'EX') return mockRedisResponse('OK');
      if (body[0] === 'GET') return mockRedisResponse(null);
      return mockRedisResponse(undefined);
    });

    const cache = new DistributedCache<string>();
    const result = await cache.getOrSet('retry-release', async () => 'data', 60_000, undefined, {
      releaseRetries: 1,
    });
    expect(result).toBe('data');
    // First call failed, second succeeded — 2 total
    expect(evalAttempts).toBe(2);
    cache.destroy();
  });

  it('deduplicates concurrent requests with custom lockConfig', async () => {
    let loadCount = 0;
    vi.mocked(fetch).mockImplementation(async (_url, opts) => {
      const body = JSON.parse((opts as RequestInit).body as string);
      if (body[0] === 'SET' && body[3] === 'NX') return mockRedisResponse('OK');
      if (body[0] === 'EVAL') return mockRedisResponse(1);
      if (body[0] === 'SET' && body[3] === 'EX') return mockRedisResponse('OK');
      if (body[0] === 'GET') return mockRedisResponse(null);
      return mockRedisResponse(undefined);
    });

    const cache = new DistributedCache<string>();
    const concurrent = Array.from({ length: 100 }).map(() =>
      cache.getOrSet(
        'dedup-cfg',
        async () => {
          loadCount++;
          await new Promise((r) => setTimeout(r, 20));
          return 'shared';
        },
        60_000,
        undefined,
        { lockTtlMs: 5000 }
      )
    );
    const results = await Promise.all(concurrent);
    expect(results.every((r) => r === 'shared')).toBe(true);
    expect(loadCount).toBe(1);
    cache.destroy();
  });
});
