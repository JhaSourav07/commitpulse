import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useRecentSearches, STORAGE_KEY } from './useRecentSearches';

describe('useRecentSearches Empty & Missing Input Fallbacks', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns an empty search list when storage is completely empty', () => {
    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.searches).toEqual([]);
  });

  it('falls back to an empty list when localStorage contains malformed JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{invalid-json');

    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.searches).toEqual([]);
  });

  it('falls back to an empty list when localStorage contains null', () => {
    window.localStorage.setItem(STORAGE_KEY, 'null');

    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.searches).toEqual([]);
  });

  it('ignores removeSearch calls when the target item does not exist', () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addSearch('octocat');
    });

    act(() => {
      result.current.removeSearch('missing-user');
    });

    expect(result.current.searches).toEqual(['octocat']);
  });

  it('remains stable when localStorage access throws unexpectedly', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.searches).toEqual([]);

    getItemSpy.mockRestore();
  });
});
