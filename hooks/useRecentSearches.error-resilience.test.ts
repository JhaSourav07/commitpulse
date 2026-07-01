import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecentSearches, STORAGE_KEY } from './useRecentSearches';

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

describe('useRecentSearches error-resilience', () => {
  it('handles corrupted JSON in localStorage gracefully', () => {
    store[STORAGE_KEY] = 'not-valid-json{{{';
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.searches).toEqual([]);
  });

  it('handles JSON with wrong type (object instead of array)', () => {
    store[STORAGE_KEY] = JSON.stringify({ user: 'torvalds' });
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.searches).toEqual([]);
  });

  it('handles JSON with null at root gracefully', () => {
    store[STORAGE_KEY] = JSON.stringify(null);
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.searches).toEqual([]);
  });

  it('handles empty localStorage for the storage key', () => {
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.searches).toEqual([]);
  });

  it('continues to work after recovering from corrupted data', () => {
    store[STORAGE_KEY] = 'bad-data';
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.searches).toEqual([]);
    act(() => {
      result.current.addSearch('torvalds');
    });
    expect(result.current.searches).toEqual(['torvalds']);
  });
});
