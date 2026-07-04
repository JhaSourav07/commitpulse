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
});

afterAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: originalLocalStorage,
    writable: true,
    configurable: true,
  });
});

describe('useRecentSearches timezone-boundaries', () => {
  it('operates correctly at DST spring-forward moment (2024-03-10 01:59 → 03:00)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-10T01:59:00-05:00'));
    const { result: r1 } = renderHook(() => useRecentSearches());
    act(() => {
      r1.current.addSearch('spring-forward');
    });
    expect(r1.current.searches).toEqual(['spring-forward']);
    vi.setSystemTime(new Date('2024-03-10T03:00:00-04:00'));
    const { result: r2 } = renderHook(() => useRecentSearches());
    expect(r2.current.searches).toEqual(['spring-forward']);
    vi.useRealTimers();
  });

  it('operates correctly at DST fall-back moment (2024-11-03 01:59 EDT → 01:00 EST)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-11-03T01:59:00-04:00'));
    const { result: r1 } = renderHook(() => useRecentSearches());
    act(() => {
      r1.current.addSearch('fall-back');
    });
    vi.setSystemTime(new Date('2024-11-03T01:00:00-05:00'));
    const { result: r2 } = renderHook(() => useRecentSearches());
    expect(r2.current.searches).toEqual(['fall-back']);
    vi.useRealTimers();
  });

  it('handles add/search across a leap year boundary (Feb 29)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-29T12:00:00Z'));
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      result.current.addSearch('leap-day');
    });
    expect(result.current.searches).toEqual(['leap-day']);
    vi.useRealTimers();
  });

  it('handles add/search across a year boundary (Dec 31 23:59 → Jan 1 00:00)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-12-31T23:59:00Z'));
    const { result: r1 } = renderHook(() => useRecentSearches());
    act(() => {
      r1.current.addSearch('year-end');
    });
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const { result: r2 } = renderHook(() => useRecentSearches());
    expect(r2.current.searches).toEqual(['year-end']);
    vi.useRealTimers();
  });

  it('produces identical behavior across different UTC offsets (UTC+0 vs UTC+12)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T00:00:00+00:00'));
    const { result: r1 } = renderHook(() => useRecentSearches());
    act(() => {
      r1.current.addSearch('utc');
    });
    vi.setSystemTime(new Date('2024-06-15T12:00:00+12:00'));
    const { result: r2 } = renderHook(() => useRecentSearches());
    act(() => {
      r2.current.addSearch('utc');
    });
    expect(r2.current.searches).toEqual(['utc']);
    vi.useRealTimers();
  });
});
