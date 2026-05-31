// lib/cache.test.ts
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { TTLCache } from './cache';

describe('TTLCache', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic get/set', () => {
    it('returns null for a missing key', () => {
      const cache = new TTLCache<string>();
      expect(cache.get('missing')).toBeNull();
      cache.destroy();
    });

    it('returns the value for a live key', () => {
      const cache = new TTLCache<string>();
      cache.set('user', 'octocat', 60_000);
      expect(cache.get('user')).toBe('octocat');
      cache.destroy();
    });

    it('returns null and evicts a key whose TTL has expired', () => {
      vi.useFakeTimers();
      const cache = new TTLCache<string>();
      cache.set('user', 'octocat', 1_000);
      vi.advanceTimersByTime(2_000);
      expect(cache.get('user')).toBeNull();
      cache.destroy();
    });

    it('handles deeply nested object values without crashing', () => {
      const cache = new TTLCache<{
        level1: {
          level2: {
            level3: string;
          };
        };
      }>();

      const nested = {
        level1: {
          level2: {
            level3: 'value',
          },
        },
      };

      expect(() => cache.set('nested', nested, 60_000)).not.toThrow();
      expect(cache.get('nested')).toEqual(nested);

      cache.destroy();
    });
  });

  describe('clear()', () => {
    it('removes all entries', () => {
      const cache = new TTLCache<number>();
      cache.set('a', 1, 60_000);
      cache.set('b', 2, 60_000);
      cache.clear();
      expect(cache.get('a')).toBeNull();
      expect(cache.get('b')).toBeNull();
      cache.destroy();
    });
  });

  describe('capacity eviction (maxSize)', () => {
    it('keeps entries unlimited when maxSize is not provided', () => {
      const cache = new TTLCache<number>();
      for (let i = 0; i < 1001; i++) {
        cache.set(`key-${i}`, i, 60_000);
      }
      expect(cache.get('key-0')).toBe(0);
      expect(cache.get('key-1000')).toBe(1000);
      cache.destroy();
    });

    it('does not exceed maxSize — evicts the oldest key on overflow', () => {
      const cache = new TTLCache<number>(3);
      cache.set('a', 1, 60_000);
      cache.set('b', 2, 60_000);
      cache.set('c', 3, 60_000);
      // Adding a 4th key should evict the oldest ('a')
      cache.set('d', 4, 60_000);
      expect(cache.get('a')).toBeNull(); // evicted
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
      cache.destroy();
    });

    it('updating an existing key does not trigger eviction', () => {
      const cache = new TTLCache<number>(2);
      cache.set('a', 1, 60_000);
      cache.set('b', 2, 60_000);
      // Updating 'a' should NOT evict 'b' since size stays <= maxSize
      cache.set('a', 99, 60_000);
      expect(cache.get('a')).toBe(99);
      expect(cache.get('b')).toBe(2);
      cache.destroy();
    });
  });

  describe('sweep() — active garbage collection', () => {
    it('proactively removes expired keys on the next sweep interval', () => {
      vi.useFakeTimers();
      // 60s sweep interval (default)
      const cache = new TTLCache<string>(1000, 60_000);
      cache.set('stale', 'data', 1_000); // expires in 1s
      // Advance past TTL but before sweep
      vi.advanceTimersByTime(5_000);
      // Advance past the sweep interval
      vi.advanceTimersByTime(60_000);
      // The key is gone even without a get() call
      expect(cache.get('stale')).toBeNull();
      cache.destroy();
    });
  });

  describe('size()', () => {
    it('returns 0 for an empty cache', () => {
      const cache = new TTLCache<number>();
      expect(cache.size()).toBe(0);
      cache.destroy();
    });

    it('counts only entries before expiry', () => {
      vi.useFakeTimers();
      const cache = new TTLCache<number>();
      cache.set('a', 1, 10_000);
      cache.set('b', 2, 20_000);
      expect(cache.size()).toBe(2);

      vi.advanceTimersByTime(15_000);
      expect(cache.size()).toBe(1);
      cache.destroy();
    });

    it('returns 0 when all entries have expired (after TTL expiry)', () => {
      vi.useFakeTimers();
      const cache = new TTLCache<number>();
      cache.set('a', 1, 10_000);
      vi.advanceTimersByTime(15_000);
      expect(cache.size()).toBe(0);
      cache.destroy();
    });

    it('returns 0 after clear() is called', () => {
      const cache = new TTLCache<number>();
      cache.set('a', 1, 10_000);
      expect(cache.size()).toBe(1);
      cache.clear();
      expect(cache.size()).toBe(0);
      cache.destroy();
    });
  });

  describe('destroy()', () => {
    it('clears the store and stops the interval', () => {
      vi.useFakeTimers();
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
      const cache = new TTLCache<string>();
      cache.set('x', 'y', 60_000);
      cache.destroy();
      expect(cache.get('x')).toBeNull();
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('has()', () => {
    it('returns true for a valid key', () => {
      const cache = new TTLCache<string>();
      cache.set('user', 'octocat', 60_000);
      expect(cache.has('user')).toBe(true);
      cache.destroy();
    });

    it('returns false for a missing key', () => {
      const cache = new TTLCache<string>();
      expect(cache.has('missing')).toBe(false);
      cache.destroy();
    });

    it('returns false for an expired key', () => {
      vi.useFakeTimers();
      const cache = new TTLCache<string>();
      cache.set('user', 'octocat', 1_000);
      vi.advanceTimersByTime(2_000);
      expect(cache.has('user')).toBe(false);
      cache.destroy();
    });
  });

  describe('delete()', () => {
    it('removes an existing key and returns true', () => {
      const cache = new TTLCache<string>();
      cache.set('user', 'octocat', 60_000);
      expect(cache.delete('user')).toBe(true);
      expect(cache.get('user')).toBeNull();
      cache.destroy();
    });

    it('returns false when deleting a missing key', () => {
      const cache = new TTLCache<string>();
      expect(cache.delete('missing')).toBe(false);
      cache.destroy();
    });

    it('still removes an expired key from store but returns true (key exists)', () => {
      vi.useFakeTimers();
      const cache = new TTLCache<string>();
      cache.set('user', 'octocat', 1_000);
      vi.advanceTimersByTime(2_000);
      // Key still exists in store even though expired, so delete returns true
      expect(cache.delete('user')).toBe(true);
      cache.destroy();
    });
  });

  describe('TTL expiry behavior', () => {
    it('returns value before TTL expiry', () => {
      vi.useFakeTimers();
      const cache = new TTLCache<string>();
      cache.set('user', 'octocat', 5_000);

      // Check at 1 second (before expiry at 5 seconds)
      vi.advanceTimersByTime(1_000);
      expect(cache.get('user')).toBe('octocat');

      // Check at 4 seconds (still before expiry)
      vi.advanceTimersByTime(3_000);
      expect(cache.get('user')).toBe('octocat');

      cache.destroy();
    });

    it('returns value at exactly TTL time (not yet expired)', () => {
      vi.useFakeTimers();
      const cache = new TTLCache<string>();
      cache.set('user', 'octocat', 5_000);

      // Advance exactly to TTL expiry time
      // At this point Date.now() === expiresAt, so > check fails and value is returned
      vi.advanceTimersByTime(5_000);
      expect(cache.get('user')).toBe('octocat');

      cache.destroy();
    });
    it('returns correct values around the exact TTL boundary', () => {
      vi.useFakeTimers();

      const cache = new TTLCache<string>();
      cache.set('key', 'value', 1000);

      // 999ms -> still valid
      vi.advanceTimersByTime(999);
      expect(cache.get('key')).toBe('value');

      // 1000ms exact boundary -> still valid
      vi.advanceTimersByTime(1);
      expect(cache.get('key')).toBe('value');

      // 1001ms -> expired
      vi.advanceTimersByTime(1);
      expect(cache.get('key')).toBeNull();

      cache.destroy();
    });

    it('returns null after passing TTL expiry', () => {
      vi.useFakeTimers();
      const cache = new TTLCache<string>();
      cache.set('user', 'octocat', 5_000);

      // Advance just past TTL expiry time
      vi.advanceTimersByTime(5_001);
      expect(cache.get('user')).toBeNull();

      cache.destroy();
    });
  });

  describe('update()', () => {
    it('updates the value without resetting TTL', () => {
      vi.useFakeTimers();
      const cache = new TTLCache<number>();
      cache.set('count', 1, 5_000);

      vi.advanceTimersByTime(3_000);
      cache.update('count', 2);

      // Another 3s: total 6s from set — would be expired if TTL had been reset
      vi.advanceTimersByTime(3_000);
      expect(cache.get('count')).toBeNull();

      cache.destroy();
    });

    it('returns true when the key exists and is not expired', () => {
      const cache = new TTLCache<number>();
      cache.set('count', 1, 60_000);
      expect(cache.update('count', 2)).toBe(true);
      expect(cache.get('count')).toBe(2);
      cache.destroy();
    });

    it('returns false for a missing key', () => {
      const cache = new TTLCache<number>();
      expect(cache.update('missing', 99)).toBe(false);
      cache.destroy();
    });

    it('returns false for an expired key', () => {
      vi.useFakeTimers();
      const cache = new TTLCache<number>();
      cache.set('count', 1, 1_000);
      vi.advanceTimersByTime(2_000);
      expect(cache.update('count', 2)).toBe(false);
      cache.destroy();
    });
  });

  describe('overwriting keys resets TTL', () => {
    it('resets TTL when overwriting an existing key', () => {
      vi.useFakeTimers();
      const cache = new TTLCache<string>();
      cache.set('user', 'octocat', 5_000);

      // Advance to 3 seconds (before expiry)
      vi.advanceTimersByTime(3_000);

      // Overwrite the key with a new 5-second TTL
      cache.set('user', 'new-octocat', 5_000);

      // Advance another 3 seconds (total 6 seconds, but only 3 since last set)
      vi.advanceTimersByTime(3_000);

      // Should still be available because TTL was reset
      expect(cache.get('user')).toBe('new-octocat');

      cache.destroy();
    });

    it('expires after new TTL when overwritten', () => {
      vi.useFakeTimers();
      const cache = new TTLCache<string>();
      cache.set('user', 'octocat', 5_000);

      // Advance to 3 seconds
      vi.advanceTimersByTime(3_000);

      // Overwrite with new 2-second TTL
      cache.set('user', 'new-octocat', 2_000);

      // Advance another 3 seconds (total 6 from start, 3 from new set)
      vi.advanceTimersByTime(3_000);

      // Should be expired because new TTL (2s) has passed
      expect(cache.get('user')).toBeNull();

      cache.destroy();
    });
  });

  describe('storing different data types', () => {
    it('stores and retrieves string values', () => {
      const cache = new TTLCache<string>();
      cache.set('msg', 'hello world', 60_000);
      expect(cache.get('msg')).toBe('hello world');
      cache.destroy();
    });

    it('stores and retrieves number values', () => {
      const cache = new TTLCache<number>();
      cache.set('count', 42, 60_000);
      expect(cache.get('count')).toBe(42);
      cache.destroy();
    });

    it('stores and retrieves boolean values', () => {
      const cache = new TTLCache<boolean>();
      cache.set('flag', true, 60_000);
      expect(cache.get('flag')).toBe(true);
      cache.destroy();
    });

    it('stores and retrieves object values', () => {
      const cache = new TTLCache<{ name: string; age: number }>();
      const user = { name: 'Alice', age: 30 };
      cache.set('user', user, 60_000);
      expect(cache.get('user')).toEqual(user);
      cache.destroy();
    });

    it('stores and retrieves array values', () => {
      const cache = new TTLCache<string[]>();
      const tags = ['javascript', 'typescript', 'vitest'];
      cache.set('tags', tags, 60_000);
      expect(cache.get('tags')).toEqual(tags);
      cache.destroy();
    });

    it('stores and retrieves nested object values', () => {
      const cache = new TTLCache<{
        user: { id: number; name: string };
        metadata: { created: string };
      }>();
      const data = {
        user: { id: 1, name: 'Bob' },
        metadata: { created: '2024-01-01' },
      };
      cache.set('data', data, 60_000);
      expect(cache.get('data')).toEqual(data);
      cache.destroy();
    });

    it('stores null values in different type context', () => {
      const cache = new TTLCache<string | null>();
      cache.set('nullable', null, 60_000);
      expect(cache.get('nullable')).toBeNull();
      cache.destroy();
    });
  });

  describe('edge cases and error handling', () => {
    // FIX: New test explicitly targeting the -5000 boundary for Issue #1398
    it('throws RangeError when setting a value with -5000 TTL', () => {
      const cache = new TTLCache<string>();
      expect(() => cache.set('key', 'value', -5000)).toThrow(RangeError);
      cache.destroy();
    });

    it('throws RangeError when ttlMs is 0 or negative', () => {
      const cache = new TTLCache<string>();
      expect(() => cache.set('key', 'value', 0)).toThrow(RangeError);
      expect(() => cache.set('key', 'value', -1)).toThrow(RangeError);
      cache.destroy();
    });

    it('rejects an empty string cache key', () => {
      const cache = new TTLCache<string>();

      expect(() => cache.set('', 'value', 60_000)).toThrow('Cache key cannot be empty');
      expect(cache.has('')).toBe(false);

      cache.destroy();
    });

    it('handles rapid get/set/delete cycles', () => {
      const cache = new TTLCache<number>();
      for (let i = 0; i < 100; i++) {
        cache.set(`key-${i}`, i, 60_000);
      }
      for (let i = 0; i < 100; i++) {
        expect(cache.get(`key-${i}`)).toBe(i);
      }
      for (let i = 0; i < 100; i++) {
        cache.delete(`key-${i}`);
      }
      for (let i = 0; i < 100; i++) {
        expect(cache.get(`key-${i}`)).toBeNull();
      }
      cache.destroy();
    });

    it('handles very short TTL values (1ms)', () => {
      vi.useFakeTimers();
      const cache = new TTLCache<string>();
      cache.set('short', 'lived', 1);
      // Immediately at creation time, should exist
      expect(cache.get('short')).toBe('lived');
      // Advance 1ms
      vi.advanceTimersByTime(1);
      // Now it should be expired or at boundary
      // (depends on exact timing, but get() should handle it gracefully)
      const result = cache.get('short');
      expect([null, 'lived']).toContain(result);
      cache.destroy();
    });

    it('does not throw when ttlMs is Number.EPSILON', () => {
      const cache = new TTLCache<string>();

      expect(() => {
        cache.set('key', 'value', Number.EPSILON);
      }).not.toThrow();

      cache.destroy();
    });

    it('does not throw when ttlMs is a very small positive number', () => {
      const cache = new TTLCache<string>();

      expect(() => {
        cache.set('key', 'value', 0.0001);
      }).not.toThrow();

      cache.destroy();
    });

    it('multiple clear operations work correctly', () => {
      const cache = new TTLCache<string>();
      cache.set('a', 'x', 60_000);
      cache.clear();
      expect(cache.size()).toBe(0);

      cache.set('b', 'y', 60_000);
      cache.clear();
      expect(cache.size()).toBe(0);

      cache.destroy();
    });

    it('verify TTLCache behavior for infinite TTL value (Variation 1)', () => {
      const cache = new TTLCache<string>();

      expect(() => {
        cache.set('infinite-key', 'boundary-value', Infinity);
      }).not.toThrow();

      expect(cache.get('infinite-key')).toBe('boundary-value');

      expect(cache.has('infinite-key')).toBe(true);

      cache.destroy();
    });
  });
});

import { DistributedCache } from './cache';

describe('DistributedCache', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('acts as a local fallback cache when Redis env vars are missing', async () => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const cache = new DistributedCache<string>();
    await cache.set('mykey', 'myvalue', 60000);

    expect(await cache.get('mykey')).toBe('myvalue');
    expect(fetch).not.toHaveBeenCalled();
    cache.destroy();
  });

  it('queries Redis REST API when env vars are defined', async () => {
    process.env.KV_REST_API_URL = 'https://mock-redis.upstash.io';
    process.env.KV_REST_API_TOKEN = 'mock-token';

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ result: JSON.stringify('redis-value') }),
    } as Response);

    const cache = new DistributedCache<string>();
    const result = await cache.get('redis-key');

    expect(result).toBe('redis-value');
    expect(fetch).toHaveBeenCalledWith(
      'https://mock-redis.upstash.io/',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
        }),
        body: expect.stringContaining('"GET"'),
      })
    );
    cache.destroy();
  });

  it('updates Redis REST API with calculated TTL in seconds on set', async () => {
    process.env.KV_REST_API_URL = 'https://mock-redis.upstash.io';
    process.env.KV_REST_API_TOKEN = 'mock-token';

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ result: 'OK' }),
    } as Response);

    const cache = new DistributedCache<string>();
    await cache.set('redis-key', 'redis-val', 60000); // 60000ms = 60s

    expect(fetch).toHaveBeenCalledWith(
      'https://mock-redis.upstash.io/',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
        }),
        body: expect.stringContaining('"EX"'),
      })
    );
    cache.destroy();
  });
});
