import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('reads from the localStorage cache before falling back to the initialValue on first render', () => {
    // Pre-seed the cache as a stub of a prior successful write
    localStorage.setItem('theme', JSON.stringify('dark'));

    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    const { result } = renderHook(() => useLocalStorage('theme', 'light'));

    // Cache must have been queried
    expect(getItemSpy).toHaveBeenCalledWith('theme');
    // Cached value must win over initialValue
    expect(result.current[0]).toBe('dark');
  });

  it('returns the initialValue when the localStorage cache has no entry for the key', () => {
    // Cache is empty — simulates a cold start with no prior data
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('missing-key', 'fallback'));

    expect(getItemSpy).toHaveBeenCalledWith('missing-key');
    // Must return initialValue when cache miss occurs
    expect(result.current[0]).toBe('fallback');
  });

  it('writes the new value to the localStorage cache on a successful setValue call', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const { result } = renderHook(() => useLocalStorage('user', 'alice'));

    act(() => {
      result.current[1]('bob');
    });

    // Cache sync must have been written on the success path
    expect(setItemSpy).toHaveBeenCalledWith('user', JSON.stringify('bob'));
    // React state must also be updated
    expect(result.current[0]).toBe('bob');
  });

  it('falls back gracefully without throwing when localStorage.setItem throws a quota exceeded error', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    const { result } = renderHook(() => useLocalStorage('quota-key', 'original'));

    // Must not throw even when the cache write fails
    expect(() => {
      act(() => {
        result.current[1]('new-value');
      });
    }).not.toThrow();

    // In-memory React state must still update despite the cache write failure
    expect(result.current[0]).toBe('new-value');
  });

  it('re-syncs from the localStorage cache when the key changes', () => {
    localStorage.setItem('key-a', JSON.stringify('value-a'));
    localStorage.setItem('key-b', JSON.stringify('value-b'));

    const { result, rerender } = renderHook(
      ({ storageKey }: { storageKey: string }) => useLocalStorage(storageKey, 'default'),
      { initialProps: { storageKey: 'key-a' } }
    );

    // Initial key must load from cache
    expect(result.current[0]).toBe('value-a');

    // Changing the key must trigger a re-sync from the new cache entry
    rerender({ storageKey: 'key-b' });
    expect(result.current[0]).toBe('value-b');
  });
});
