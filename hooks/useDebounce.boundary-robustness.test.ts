import { useEffect } from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';

// Helper hook used to observe how many times the debounced value settles.
// We rely on a useEffect that runs on every debounced value change so that
// we can assert the exact number of resolutions across rapid input bursts.
function useObservedDebounce(value: string, delay: number, onResolved: (value: string) => void) {
  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    onResolved(debouncedValue);
  }, [debouncedValue, onResolved]);
}

describe('useDebounce Boundary Robustness Tests', () => {
  it('resolves exactly once after a high-frequency burst of synchronous inputs', () => {
    // Boundary case: many rapid inputs in a single tick must still collapse
    // into a single resolution after the timer expires.
    vi.useFakeTimers();
    const onResolved = vi.fn();

    try {
      const { rerender } = renderHook(
        ({ value }: { value: string }) => useObservedDebounce(value, 300, onResolved),
        { initialProps: { value: '' } }
      );

      // Ignore the initial mount call so we only measure burst behaviour.
      onResolved.mockClear();

      // Fire ten rapid synchronous updates — simulates a user typing a long
      // username faster than the debounce window.
      const burst = [
        'o',
        'oc',
        'oct',
        'octo',
        'octoc',
        'octoca',
        'octocat',
        'octocat1',
        'octocat12',
        'octocat123',
      ];
      burst.forEach((value) => rerender({ value }));

      // Just below the boundary — nothing should have settled yet.
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(onResolved).not.toHaveBeenCalled();

      // Crossing the boundary should trigger exactly one resolution
      // carrying the final value from the burst.
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onResolved).toHaveBeenCalledTimes(1);
      expect(onResolved).toHaveBeenCalledWith('octocat123');
    } finally {
      vi.useRealTimers();
    }
  });

  it('resolves on the next tick when the delay boundary is zero', () => {
    // Boundary case: a delay of 0ms is the smallest legal timer value and
    // must still flush the value through the setTimeout queue exactly once.
    vi.useFakeTimers();
    const onResolved = vi.fn();

    try {
      const { rerender } = renderHook(
        ({ value }: { value: string }) => useObservedDebounce(value, 0, onResolved),
        { initialProps: { value: '' } }
      );

      onResolved.mockClear();

      rerender({ value: 'a' });
      rerender({ value: 'ab' });
      rerender({ value: 'abc' });

      // Even with a zero delay, the resolution is queued via setTimeout
      // and only fires after the timer loop advances.
      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(onResolved).toHaveBeenCalledTimes(1);
      expect(onResolved).toHaveBeenCalledWith('abc');
    } finally {
      vi.useRealTimers();
    }
  });

  it('holds the previous value until a very large delay boundary fully elapses', () => {
    // Boundary case: an unusually large delay must not resolve early under
    // any circumstance — the hook must wait the full duration.
    vi.useFakeTimers();

    try {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 10000), {
        initialProps: { value: 'initial' },
      });

      rerender({ value: 'updated' });

      // One millisecond before the boundary — value must still be stale.
      act(() => {
        vi.advanceTimersByTime(9999);
      });
      expect(result.current).toBe('initial');

      // Crossing the exact boundary settles the value.
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe('updated');
    } finally {
      vi.useRealTimers();
    }
  });

  it('resolves exactly once when the rapid burst contains identical repeated values', () => {
    // Boundary case: repeated identical inputs still trigger rerenders, but
    // the debounced output must collapse them into a single resolution.
    vi.useFakeTimers();
    const onResolved = vi.fn();

    try {
      const { rerender } = renderHook(
        ({ value }: { value: string }) => useObservedDebounce(value, 300, onResolved),
        { initialProps: { value: '' } }
      );

      onResolved.mockClear();

      rerender({ value: 'repeat' });
      rerender({ value: 'repeat' });
      rerender({ value: 'repeat' });
      rerender({ value: 'repeat' });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(onResolved).toHaveBeenCalledTimes(1);
      expect(onResolved).toHaveBeenCalledWith('repeat');
    } finally {
      vi.useRealTimers();
    }
  });

  it('resolves exactly once per burst across two consecutive settled bursts', () => {
    // Boundary case: after a burst fully settles, a second burst must be
    // treated as an independent debounce cycle and resolve exactly once on
    // its own boundary — no leaking timers from the first cycle.
    vi.useFakeTimers();
    const onResolved = vi.fn();

    try {
      const { rerender } = renderHook(
        ({ value }: { value: string }) => useObservedDebounce(value, 300, onResolved),
        { initialProps: { value: '' } }
      );

      onResolved.mockClear();

      // First burst.
      rerender({ value: 'a' });
      rerender({ value: 'ab' });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(onResolved).toHaveBeenCalledTimes(1);
      expect(onResolved).toHaveBeenLastCalledWith('ab');

      // Second independent burst after the first one fully resolved.
      rerender({ value: 'abc' });
      rerender({ value: 'abcd' });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(onResolved).toHaveBeenCalledTimes(2);
      expect(onResolved).toHaveBeenLastCalledWith('abcd');
    } finally {
      vi.useRealTimers();
    }
  });
});
