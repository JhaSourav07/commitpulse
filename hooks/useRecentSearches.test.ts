import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecentSearches } from './useRecentSearches';

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

  it('caps at 5 entries', () => {
    const { result } = renderHook(() => useRecentSearches());
    ['a', 'b', 'c', 'd', 'e', 'f'].forEach((u) => {
      act(() => {
        result.current.addSearch(u);
      });
    });
    expect(result.current.searches.length).toBe(5);
  });

  it('clears all searches', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('torvalds');
    });
    act(() => {
      result.current.clearSearches();
    });
    expect(result.current.searches).toEqual([]);
  });
});
