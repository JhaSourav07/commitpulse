import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecentSearches, STORAGE_KEY } from './useRecentSearches';

const store: Record<string, string> = {};
const originalLocalStorage = window.localStorage;

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
  vi.restoreAllMocks();
});

afterAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: originalLocalStorage,
    writable: true,
    configurable: true,
  });
});

describe('useRecentSearches - Error Resilience', () => {
  it('falls back to an empty list when localStorage.getItem throws during hydration', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage blocked');
    });

    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.searches).toEqual([]);
  });

  it('falls back to an empty list when stored JSON is malformed', () => {
    store[STORAGE_KEY] = '{not-valid-json';

    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.searches).toEqual([]);
  });

  it('keeps updating React state via addSearch even when localStorage.setItem throws', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addSearch('torvalds');
    });
    expect(result.current.searches).toEqual(['torvalds']);

    act(() => {
      result.current.addSearch('gaearon');
    });
    expect(result.current.searches).toEqual(['gaearon', 'torvalds']);
  });

  it('still clears in-memory state via clearSearches even when localStorage.removeItem throws', () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addSearch('torvalds');
    });
    expect(result.current.searches).toEqual(['torvalds']);

    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    act(() => {
      result.current.clearSearches();
    });

    expect(result.current.searches).toEqual([]);
  });

  it('recovers on a fresh mount after a transient read failure clears up', () => {
    const getItemSpy = vi.spyOn(window.localStorage, 'getItem');

    getItemSpy.mockImplementationOnce(() => {
      throw new Error('Storage unavailable');
    });

    const { result: firstMount } = renderHook(() => useRecentSearches());
    expect(firstMount.current.searches).toEqual([]);

    getItemSpy.mockRestore();
    store[STORAGE_KEY] = JSON.stringify(['octocat']);

    const { result: secondMount } = renderHook(() => useRecentSearches());
    expect(secondMount.current.searches).toEqual(['octocat']);
  });
});
