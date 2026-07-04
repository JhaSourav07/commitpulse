import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

// This suite targets #7120. The originally-specified scenarios (mocking
// async service/database imports, pending-state overlay rendering, local
// cache-layer query ordering, fallback on fake endpoint timeouts, cache
// sync on success callbacks) describe a data-fetching/service layer that
// does not exist in useDebounce.ts, which is a plain value-debouncing
// hook built on setTimeout/clearTimeout. It makes no network or cache
// calls of any kind.
//
// These tests instead cover the hook's real behavior, using fake timers
// (the correct and standard way to test debounce timing), since the
// hook's core job is deferring a value update by a fixed delay.

describe('useDebounce - core timing behavior (#7120)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately, before the delay elapses', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('does not update the debounced value before the delay has elapsed', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'a', delay: 500 },
    });

    rerender({ value: 'b', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('a');
  });

  it('updates the debounced value once the delay has fully elapsed', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'a', delay: 500 },
    });

    rerender({ value: 'b', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('b');
  });

  it('resets the timer on rapid successive value changes, only committing the latest value', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'a', delay: 500 },
    });

    rerender({ value: 'b', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: 'c', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: 'd', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('d');
  });

  it('clears the pending timer on unmount, so no update fires after the component is gone', () => {
    const clearSpy = vi.spyOn(global, 'clearTimeout');
    const { unmount } = renderHook(() => useDebounce('a', 500));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
