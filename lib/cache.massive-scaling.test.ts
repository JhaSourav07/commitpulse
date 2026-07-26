/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { TTLCache, DistributedCache } from './cache';

describe('cache-massive-scaling', () => {
  describe('Large Dataset Compression & Decompression', () => {
    it('should successfully store, Brotli-compress, and decompress an extremely large payload', () => {
      const cache = new TTLCache<any>();
      const key = 'massive-contributor-log';

      // 1. Generate 10,000 mock contributor actions (representing a massive user activity payload)
      const massiveData: any[] = [];
      for (let i = 0; i < 10000; i++) {
        massiveData.push({
          id: i,
          actor: `contributor-${i}`,
          action: i % 2 === 0 ? 'commit' : 'pull_request_merge',
          sha: `sha256-abc${i}xyz`,
          timestamp: 1718164639 + i,
        });
      }

      // 2. Set the massive dataset into the cache
      expect(() => cache.set(key, massiveData, 60_000)).not.toThrow();

      // 3. Verify internal storage is Brotli compressed (stored as a Buffer)
      const internalItem = (cache as any).store.get(key);
      expect(internalItem).toBeDefined();
      expect(Buffer.isBuffer(internalItem.value)).toBe(true);

      // 4. Retrieve and assert decompression results match original data perfectly
      const retrieved = cache.get(key);
      expect(retrieved).toEqual(massiveData);
      expect(retrieved.length).toBe(10000);
      expect(retrieved[9999].actor).toBe('contributor-9999');

      cache.destroy();
    });

    it('should compress and decompress large raw string payloads', () => {
      const cache = new TTLCache<string>();
      const key = 'massive-string';
      const largeString = 'a'.repeat(5000); // Greater than 1024 characters

      cache.set(key, largeString, 60_000);

      const internalItem = (cache as any).store.get(key);
      expect(Buffer.isBuffer(internalItem.value)).toBe(true);

      const retrieved = cache.get(key);
      expect(retrieved).toBe(largeString);

      cache.destroy();
    });
  });

  describe('Eviction Scaling under Extreme Volume', () => {
    it('should maintain strict maxSize boundary under high insertion frequency', () => {
      const maxSize = 5;
      const cache = new TTLCache<number>(maxSize);

      // Rapidly insert 10,000 elements
      for (let i = 0; i < 10000; i++) {
        cache.set(`key-${i}`, i, 60_000);
      }

      // Assert size has never exceeded limit bounds
      expect(cache.size()).toBe(maxSize);

      // Assert older entries are evicted and newest entries remain
      expect(cache.get('key-0')).toBeNull();
      expect(cache.get('key-9994')).toBeNull();
      expect(cache.get('key-9995')).toBe(9995);
      expect(cache.get('key-9999')).toBe(9999);

      cache.destroy();
    });
  });

  describe('Execution Latency / Time Bound Verification', () => {
    it('should complete 1,000 rapid get/set operations with large payloads within the performance threshold', () => {
      const cache = new TTLCache<string>();
      const payload = 'b'.repeat(2000); // 2KB payload triggers Brotli compression

      const startTime = performance.now();

      // Perform 1,000 set/get cycles under load (500 iterations)
      for (let i = 0; i < 500; i++) {
        cache.set(`perf-key-${i}`, payload, 10_000);
        const val = cache.get(`perf-key-${i}`);
        expect(val).toBe(payload);
      }

      const duration = performance.now() - startTime;

      // Assert total execution latency is under 1,500 milliseconds
      expect(duration).toBeLessThan(1500);

      cache.destroy();
    });
  });

  describe('Stampede Protection & Local Promise Deduplication under Load', () => {
    it('should deduplicate concurrent fetches under load and execute loadFn exactly once', async () => {
      const cache = new DistributedCache<string>();
      const key = 'concurrent-loading-key';

      let loadCount = 0;
      const mockLoadFn = async () => {
        loadCount++;
        // Simulate database/API delay
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'freshly-fetched-data';
      };

      // Launch 500 concurrent requests simultaneously to trigger stampede
      const concurrentRequests = Array.from({ length: 500 }).map(() =>
        cache.getOrSet(key, mockLoadFn, 60_000)
      );

      const results = await Promise.all(concurrentRequests);

      // Verify all 500 requests resolved to correct data
      expect(results.length).toBe(500);
      results.forEach((res) => {
        expect(res).toBe('freshly-fetched-data');
      });

      // Verify loadFn was called exactly once due to Promise deduplication
      expect(loadCount).toBe(1);

      cache.destroy();
    });
  });

  describe('Key Length Limits and Buffer Boundaries', () => {
    it('should accept keys up to exactly 10,000 characters and reject exceeding lengths', () => {
      const cache = new TTLCache<string>();

      const exactLimitKey = 'x'.repeat(10000);
      const exceedingKey = 'y'.repeat(10001);

      // Key at exactly 10,000 chars should be stored and retrieved successfully
      expect(() => cache.set(exactLimitKey, 'valid-boundary', 60_000)).not.toThrow();
      expect(cache.get(exactLimitKey)).toBe('valid-boundary');

      // Key at 10,001 chars should throw to avoid memory bloat
      expect(() => cache.set(exceedingKey, 'invalid-boundary', 60_000)).toThrow(
        'Cache key exceeds maximum allowed length to prevent memory bloat'
      );

      cache.destroy();
    });
  });
});
