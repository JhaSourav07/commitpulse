import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit, RateLimiter } from './rate-limit';

// ---------------------------------------------------------------------------
// Mock Vercel KV for Rate Limiter Testing
// ---------------------------------------------------------------------------

const { mockKvStore, mockSets, mockKv } = vi.hoisted(() => {
  const store = new Map<string, { value: number; expiresAt: number | null }>();
  const sets = new Map<string, Set<string>>();

  const kv = {
    incr: vi.fn(async (key: string) => {
      const entry = store.get(key) || { value: 0, expiresAt: null };
      if (entry.expiresAt && Date.now() >= entry.expiresAt) {
        entry.value = 0;
        entry.expiresAt = null;
      }
      entry.value += 1;
      store.set(key, entry);
      return entry.value;
    }),
    expire: vi.fn(async (key: string, seconds: number) => {
      const entry = store.get(key);
      if (entry) {
        entry.expiresAt = Date.now() + seconds * 1000;
      }
      return 1;
    }),
    pttl: vi.fn(async (key: string) => {
      const entry = store.get(key);
      if (!entry || !entry.expiresAt) return -1;
      const ttl = entry.expiresAt - Date.now();
      return ttl > 0 ? ttl : -1;
    }),
    sismember: vi.fn(async (key: string, member: string) => {
      const set = sets.get(key);
      return set && set.has(member) ? 1 : 0;
    }),
    sadd: vi.fn(async (key: string, member: string) => {
      if (!sets.has(key)) sets.set(key, new Set());
      sets.get(key)!.add(member);
      return 1;
    }),
    srem: vi.fn(async (key: string, member: string) => {
      if (!sets.has(key)) return 0;
      sets.get(key)!.delete(member);
      return 1;
    }),
    del: vi.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
    get: vi.fn(async (key: string) => {
      const entry = store.get(key);
      if (entry && entry.expiresAt && Date.now() >= entry.expiresAt) return null;
      return entry ? entry.value : null;
    }),
    pipeline: vi.fn(() => {
      const cmds: Array<() => Promise<number>> = [];
      const p = {
        incr: (key: string) => {
          cmds.push(() => kv.incr(key));
          return p;
        },
        pttl: (key: string) => {
          cmds.push(() => kv.pttl(key));
          return p;
        },
        sismember: (k: string, m: string) => {
          cmds.push(() => kv.sismember(k, m));
          return p;
        },
        exec: async () => Promise.all(cmds.map((c) => c())),
      };
      return p;
    }),
  };

  return { mockKvStore: store, mockSets: sets, mockKv: kv };
});

vi.mock('@vercel/kv', () => ({
  kv: mockKv,
}));

// ---------------------------------------------------------------------------
// Rate Limiter Tests
// ---------------------------------------------------------------------------

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockKvStore.clear();
    mockSets.clear();
    vi.clearAllMocks();
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

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockKvStore.clear();
    mockSets.clear();
    vi.clearAllMocks();
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
});
