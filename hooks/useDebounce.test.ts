import { useEffect } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';

function useObservedDebounce(value: string, onResolved: (value: string) => void) {
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    onResolved(debouncedValue);
  }, [debouncedValue, onResolved]);
}

describe('useDebounce', () => {
  it('resolves rapid synchronous query inputs exactly once after the timer expires', () => {
    vi.useFakeTimers();
    const onResolved = vi.fn();

    try {
      const { rerender } = renderHook(
        ({ value }: { value: string }) => useObservedDebounce(value, onResolved),
        { initialProps: { value: '' } }
      );

      onResolved.mockClear();

      rerender({ value: 'o' });
      rerender({ value: 'oc' });
      rerender({ value: 'octocat' });

      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(onResolved).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onResolved).toHaveBeenCalledTimes(1);
      expect(onResolved).toHaveBeenCalledWith('octocat');
    } finally {
      vi.useRealTimers();
    }
  });
});
