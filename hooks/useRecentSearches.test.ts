import React from 'react';
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
  it('ignores empty string input', () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addSearch('');
    });

    expect(result.current.searches).toEqual([]);
  });

  it('ignores whitespace-only input', () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addSearch('   ');
    });

    expect(result.current.searches).toEqual([]);
  });

  it('ignores newline-only input', () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addSearch('\n');
    });

    expect(result.current.searches).toEqual([]);
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
    expect(removeItemSpy).toHaveBeenCalledTimes(1);
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

  it('ignores valid JSON from localStorage when it is not an array', () => {
    store[STORAGE_KEY] = JSON.stringify({ value: 'octocat' });

    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.searches).toEqual([]);

    act(() => {
      result.current.addSearch('torvalds');
    });

    expect(result.current.searches).toEqual(['torvalds']);
  });

  it('filters non-string entries loaded from localStorage', () => {
    store[STORAGE_KEY] = JSON.stringify(['octocat', null, 42, 'torvalds']);

    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.searches).toEqual(['octocat', 'torvalds']);
  });

  it('is safe under Strict Mode double invocation', () => {
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem');
    const removeItemSpy = vi.spyOn(window.localStorage, 'removeItem');
    const { result } = renderHook(() => useRecentSearches(), {
      wrapper: React.StrictMode,
    });

    // Hydration sets the state from storage (starts empty)
    expect(result.current.searches).toEqual([]);
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(removeItemSpy).not.toHaveBeenCalled();

    act(() => {
      result.current.addSearch('torvalds');
    });

    expect(result.current.searches).toEqual(['torvalds']);
    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(['torvalds']));
    expect(removeItemSpy).not.toHaveBeenCalled();
  });

  it('performs localStorage writes reactively outside state updater logic', () => {
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem');
    const removeItemSpy = vi.spyOn(window.localStorage, 'removeItem');
    const { result } = renderHook(() => useRecentSearches());

    // Initially loading from storage should not trigger any writes or removals
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(removeItemSpy).not.toHaveBeenCalled();

    act(() => {
      result.current.addSearch('gaearon');
    });

    // Verify localStorage.setItem is synchronized correctly
    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(['gaearon']));
    expect(removeItemSpy).not.toHaveBeenCalled();
  });
});
