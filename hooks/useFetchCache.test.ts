import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useFetchCache } from './useFetchCache';

describe('useFetchCache', () => {
  it('stores and retrieves cached values', () => {
    const { result } = renderHook(() => useFetchCache<string>());

    result.current.set('key1', 'svg-data');

    expect(result.current.get('key1')).toBe('svg-data');
  });

  it('returns undefined for missing keys', () => {
    const { result } = renderHook(() => useFetchCache<string>());

    expect(result.current.get('missing')).toBeUndefined();
  });

  it('reports whether a key exists', () => {
    const { result } = renderHook(() => useFetchCache<string>());

    result.current.set('key1', 'svg-data');

    expect(result.current.has('key1')).toBe(true);
    expect(result.current.has('key2')).toBe(false);
  });

  it('clears all cached values', () => {
    const { result } = renderHook(() => useFetchCache<string>());

    result.current.set('key1', 'svg-data');
    result.current.clear();

    expect(result.current.get('key1')).toBeUndefined();
  });

  it('evicts the oldest entry when cache exceeds 10 items', () => {
    const { result } = renderHook(() => useFetchCache<number>());

    for (let i = 1; i <= 11; i++) {
      result.current.set(`key-${i}`, i);
    }

    expect(result.current.get('key-1')).toBeUndefined();
    expect(result.current.get('key-11')).toBe(11);
  });

  it('maintains a maximum cache size of 10 entries', () => {
    const { result } = renderHook(() => useFetchCache<number>());

    for (let i = 1; i <= 15; i++) {
      result.current.set(`key-${i}`, i);
    }

    expect(result.current.get('key-1')).toBeUndefined();
    expect(result.current.get('key-2')).toBeUndefined();
    expect(result.current.get('key-5')).toBeUndefined();

    expect(result.current.get('key-6')).toBe(6);
    expect(result.current.get('key-15')).toBe(15);
  });

  describe('[Bug fix] LRU eviction, not FIFO', () => {
    it('keeps a frequently-accessed entry warm even after 10 newer insertions', () => {
      const { result } = renderHook(() => useFetchCache<string>());

      result.current.set('config-A', 'svg-A');

      // Insert 9 more entries — cache is now at its 10-entry capacity,
      // with config-A still present.
      for (let i = 0; i < 9; i++) {
        result.current.set(`config-${i}`, `svg-${i}`);
      }

      // Access config-A again — this should mark it as recently used.
      result.current.get('config-A');

      // Insert one more new entry — this pushes the cache over capacity
      // by one, forcing an eviction.
      result.current.set('config-new', 'svg-new');

      // config-A was JUST accessed, so it should survive.
      // The entry evicted should be config-0 (inserted first and never re-accessed).
      expect(result.current.has('config-A')).toBe(true);
      expect(result.current.has('config-0')).toBe(false);
    });

    it('a genuinely untouched entry still gets evicted first (baseline FIFO-compatible behavior)', () => {
      const { result } = renderHook(() => useFetchCache<string>());

      for (let i = 0; i < 11; i++) {
        result.current.set(`config-${i}`, `svg-${i}`);
      }

      // Never accessed config-0 — it should be evicted as the oldest.
      expect(result.current.has('config-0')).toBe(false);
      expect(result.current.has('config-10')).toBe(true);
    });
  });
});
