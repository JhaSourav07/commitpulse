import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useRecentSearches, STORAGE_KEY, MAX_SEARCHES } from './useRecentSearches';

describe('useRecentSearches', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('hydrates state correctly from localStorage on initialization', () => {
    const preExistingSearches = ['remix', 'astro'];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preExistingSearches));

    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.searches).toEqual(preExistingSearches);
  });

  it('persists newly appended searches to localStorage on state changes', () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addSearch('vue');
    });

    expect(result.current.searches).toEqual(['vue']);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')).toEqual(['vue']);
  });

  it('moves duplicate search entries to the absolute front of the stack', () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addSearch('typescript');
      result.current.addSearch('javascript');
    });
    expect(result.current.searches).toEqual(['javascript', 'typescript']);

    act(() => {
      result.current.addSearch('typescript');
    });
    expect(result.current.searches).toEqual(['typescript', 'javascript']);
  });

  it('enforces the max search capacity limits by slicing off tail entries over the maximum threshold', () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addSearch('search1');
      result.current.addSearch('search2');
      result.current.addSearch('search3');
      result.current.addSearch('search4');
      result.current.addSearch('search5');
      result.current.addSearch('search6'); // Exceeds MAX_SEARCHES (5)
    });

    expect(result.current.searches.length).toBe(MAX_SEARCHES);
    expect(result.current.searches).toEqual([
      'search6',
      'search5',
      'search4',
      'search3',
      'search2',
    ]);
    expect(result.current.searches).not.toContain('search1');
  });

  it('completely ignores empty strings or whitespace-only queries without modifying active state', () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addSearch('');
      result.current.addSearch('    ');
    });

    expect(result.current.searches).toEqual([]);
  });

  it('evicts only the specified single item when calling removeSearch and purges storage when cleared', () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addSearch('tailwindcss');
      result.current.addSearch('bootstrap');
      result.current.addSearch('shadcn');
    });

    act(() => {
      result.current.removeSearch('bootstrap');
    });
    expect(result.current.searches).toEqual(['shadcn', 'tailwindcss']);

    act(() => {
      result.current.clearSearches();
    });
    expect(result.current.searches).toEqual([]);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
