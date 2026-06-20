import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TTLCache, DistributedCache } from '@/lib/cache';

describe('Advanced Cache Management (Phase 2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Cache Versioning', () => {
    it('invalidates key on cache version mismatch', () => {
      const cache = new TTLCache<string>();
      cache.set('user', 'octocat', 10_000);

      // Mutate stored envelope version to mock version mismatch

      const internalStore = (cache as unknown as { store: Map<string, { value: { v?: string } }> })
        .store;
      const entry = internalStore.get('user');
      entry.value.v = 'v0'; // older mismatching version

      expect(cache.get('user')).toBeNull();
      expect(cache.has('user')).toBe(false);
      cache.destroy();
    });

    it('retains backward compatibility for unversioned legacy items', () => {
      const cache = new TTLCache<string>();

      const internalStore = (
        cache as unknown as { store: Map<string, { value: unknown; expiresAt: number }> }
      ).store;
      // Inject unversioned legacy item directly
      internalStore.set('legacy', {
        value: 'legacy-data',
        expiresAt: Date.now() + 10_000,
      });

      expect(cache.get('legacy')).toBe('legacy-data');
      cache.destroy();
    });
  });

  describe('Pattern-based Cleanup', () => {
    it('deletes keys matching a pattern while keeping others', () => {
      const cache = new TTLCache<string>();
      cache.set('user:123', 'john', 10_000);
      cache.set('user:456', 'alice', 10_000);
      cache.set('stats:789', 'data', 10_000);

      const deletedCount = cache.invalidatePattern(/^user:/);
      expect(deletedCount).toBe(2);
      expect(cache.get('user:123')).toBeNull();
      expect(cache.get('user:456')).toBeNull();
      expect(cache.get('stats:789')).toBe('data');
      cache.destroy();
    });
  });

  describe('Stale-While-Revalidate (SWR)', () => {
    it('returns stale cache immediately and triggers background fetch in SWR window', async () => {
      const cache = new DistributedCache<string>();
      let loadCount = 0;
      const loadFn = async () => {
        loadCount++;
        return `fresh-data-${loadCount}`;
      };

      // Set initial value with TTL 5s and SWR window 10s
      await cache.set('swr-test', 'initial-data', 5000, 10000);

      // Advance time by 6s (stale, but within SWR window of 10s)
      vi.advanceTimersByTime(6000);

      // Call getOrSet with swrMs = 10000
      const result = await cache.getOrSet('swr-test', loadFn, 5000, undefined, undefined, 10000);

      // Should return the stale value immediately
      expect(result).toBe('initial-data');
      expect(loadCount).toBe(1); // background loadFn triggered

      // Resolve background execution

      const bgPromise = (
        cache as unknown as { localLocks: Map<string, Promise<unknown>> }
      ).localLocks.get('swr-test');
      if (bgPromise) await bgPromise;

      // Retrieve again: should now have the fresh value from background loadFn
      const updatedResult = await cache.get('swr-test');
      expect(updatedResult).toBe('fresh-data-1');
      cache.destroy();
    });
  });

  describe('Cache Instrumentation & Stats', () => {
    it('accurately counts hits, misses, writes, and evictions', () => {
      const cache = new TTLCache<number>(2); // maxSize = 2

      // Write stats
      cache.set('a', 1, 10_000);
      cache.set('b', 2, 10_000);
      expect(cache.getStats().writes).toBe(2);

      // Hit stats
      cache.get('a');
      expect(cache.getStats().hits).toBe(1);

      // Miss stats
      cache.get('missing');
      expect(cache.getStats().misses).toBe(1);

      // Eviction stats
      cache.set('c', 3, 10_000); // evicts 'a' or 'b'
      expect(cache.getStats().evictions).toBe(1);
      cache.destroy();
    });
  });
});
