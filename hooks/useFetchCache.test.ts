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
});
