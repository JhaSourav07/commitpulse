// lib/cache/ttl-cache.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CostAwareCache } from './ttl-cache';

describe('CostAwareCache', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses base TTL for low complexity queries', () => {
    const cache = new CostAwareCache<string>(100, 10_000, 50, 60_000);
    const ttl = cache.getCalculatedTtlMs(10);
    expect(ttl).toBe(10_000);
    cache.destroy();
  });

  it('scales TTL for high complexity queries above the threshold', () => {
    const cache = new CostAwareCache<string>(100, 10_000, 50, 60_000);

    // Complexity = 100 (twice the threshold of 50)
    // ratio = (100-50)/50 = 1. scalingFactor = 2. ttlMs = 20_000.
    const ttlHigh = cache.getCalculatedTtlMs(100);
    expect(ttlHigh).toBe(20_000);

    cache.destroy();
  });

  it('caps TTL at maxTtlMs', () => {
    const cache = new CostAwareCache<string>(100, 10_000, 50, 30_000);

    // Very high complexity (e.g. 500)
    // ratio = (500-50)/50 = 9. scaling = 10. ttl = 100_000.
    // Capped at maxTtlMs = 30_000.
    const ttlCapped = cache.getCalculatedTtlMs(500);
    expect(ttlCapped).toBe(30_000);

    cache.destroy();
  });

  it('sets cache item with scaled TTL and expires correctly', () => {
    vi.useFakeTimers();
    const cache = new CostAwareCache<string>(100, 10_000, 50, 60_000);

    // Complexity = 100 -> TTL = 20s (20_000 ms)
    cache.setWithCost('key1', 'value1', 100);

    expect(cache.get('key1')).toBe('value1');

    // Advance timers by 15s (still alive)
    vi.advanceTimersByTime(15_000);
    expect(cache.get('key1')).toBe('value1');

    // Advance timers past 20s (expired)
    vi.advanceTimersByTime(6_000);
    expect(cache.get('key1')).toBeNull();

    cache.destroy();
  });
});
