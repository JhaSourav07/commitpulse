// lib/cache.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
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
});
