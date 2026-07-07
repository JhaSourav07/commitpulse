import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecentSearches, MAX_SEARCHES, STORAGE_KEY } from './useRecentSearches';

describe('useRecentSearches massive scaling behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loads thousands of stored searches without crashing', async () => {
    const hugeDataset = Array.from({ length: 10000 }, (_, i) => `search-${i}`);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(hugeDataset));

    const { result } = renderHook(() => useRecentSearches());

    await waitFor(() => {
      expect(result.current.searches.length).toBe(10000);
    });
  });

  it('keeps only MAX_SEARCHES entries when adding thousands of searches', async () => {
    const { result } = renderHook(() => useRecentSearches());

    await waitFor(() => {
      expect(Array.isArray(result.current.searches)).toBe(true);
    });

    act(() => {
      for (let i = 0; i < 5000; i++) {
        result.current.addSearch(`query-${i}`);
      }
    });

    expect(result.current.searches).toHaveLength(MAX_SEARCHES);
    expect(result.current.searches[0]).toBe('query-4999');
  });

  it('handles massive duplicate datasets efficiently', async () => {
    const { result } = renderHook(() => useRecentSearches());

    await waitFor(() => {
      expect(Array.isArray(result.current.searches)).toBe(true);
    });

    act(() => {
      for (let i = 0; i < 10000; i++) {
        result.current.addSearch('duplicate-query');
      }
    });

    expect(result.current.searches).toEqual(['duplicate-query']);
  });

  it('removes items correctly from a large search collection', async () => {
    const searches = Array.from({ length: 5000 }, (_, i) => `item-${i}`);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));

    const { result } = renderHook(() => useRecentSearches());

    await waitFor(() => {
      expect(result.current.searches.length).toBe(5000);
    });

    act(() => {
      result.current.removeSearch('item-2500');
    });

    expect(result.current.searches.includes('item-2500')).toBe(false);
    expect(result.current.searches.length).toBe(4999);
  });

  it('clears large datasets and storage within performance limits', async () => {
    const searches = Array.from({ length: 10000 }, (_, i) => `search-${i}`);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));

    const { result } = renderHook(() => useRecentSearches());

    await waitFor(() => {
      expect(result.current.searches.length).toBe(10000);
    });

    const start = performance.now();

    act(() => {
      result.current.clearSearches();
    });

    const duration = performance.now() - start;

    expect(result.current.searches).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(duration).toBeLessThan(1000);
  });
});
