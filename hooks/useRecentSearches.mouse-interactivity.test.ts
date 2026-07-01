import { describe, it, expect, vi, beforeEach } from 'vitest';
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
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    },
    writable: true,
    configurable: true,
  });
});

describe('useRecentSearches mouse-interactivity', () => {
  it('addSearch updates the searches array on interaction', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('torvalds');
    });
    expect(result.current.searches).toEqual(['torvalds']);
  });

  it('multiple rapid addSearch calls (touch-like) all register', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('a');
    });
    act(() => {
      result.current.addSearch('b');
    });
    act(() => {
      result.current.addSearch('c');
    });
    expect(result.current.searches).toEqual(['c', 'b', 'a']);
  });

  it('clearSearches resets state after previous additions', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('torvalds');
    });
    act(() => {
      result.current.clearSearches();
    });
    expect(result.current.searches).toEqual([]);
  });

  it('removeSearch propagates correctly after addSearch', () => {
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

  it('deduplication on repeated addSearch with same value', () => {
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
    expect(result.current.searches).toEqual(['torvalds', 'gaearon']);
  });
});
