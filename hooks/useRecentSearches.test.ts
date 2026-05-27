import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecentSearches, MAX_SEARCHES, STORAGE_KEY } from './useRecentSearches';

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    },
    writable: true,
  });
});

describe('useRecentSearches', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.searches).toEqual([]);
  });

  it('adds a search', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('torvalds');
    });
    expect(result.current.searches[0]).toBe('torvalds');
  });

  it('deduplicates — moves existing to front', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('torvalds');
    });
    act(() => {
      result.current.addSearch('gaearon');
    });
    act(() => {
      result.current.addSearch('torvalds');
    });
    expect(result.current.searches[0]).toBe('torvalds');
    expect(result.current.searches.length).toBe(2);
  });

  it(`caps at ${MAX_SEARCHES} entries`, () => {
    const { result } = renderHook(() => useRecentSearches());
    const testData = Array.from({ length: MAX_SEARCHES + 1 }, (_, i) =>
      String.fromCharCode(97 + i)
    );
    testData.forEach((u) => {
      act(() => {
        result.current.addSearch(u);
      });
    });
    expect(result.current.searches.length).toBe(MAX_SEARCHES);
  });

  it('clears all searches and removes localStorage key', () => {
    const removeItemSpy = vi.spyOn(window.localStorage, 'removeItem');

    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addSearch('torvalds');
    });

    act(() => {
      result.current.clearSearches();
    });

    expect(result.current.searches).toEqual([]);
    expect(removeItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('removes an individual search', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('torvalds');
    });
    act(() => {
      result.current.addSearch('gaearon');
    });
    act(() => {
      result.current.removeSearch('torvalds');
    });
    expect(result.current.searches).toEqual(['gaearon']);
  });

  it('persists searches across remounts', () => {
    const { result, unmount } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('octocat');
    });
    unmount();
    const { result: result2 } = renderHook(() => useRecentSearches());
    expect(result2.current.searches[0]).toBe('octocat');
  });
});
