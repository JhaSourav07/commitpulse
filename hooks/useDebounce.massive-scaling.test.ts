import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce massive scaling behavior', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles extremely large string payloads without truncation', () => {
    vi.useFakeTimers();

    const largeValue = 'x'.repeat(100_000);

    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: largeValue });

    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe(largeValue);
    expect(result.current.length).toBe(100_000);
  });

  it('handles thousands of rapid updates and resolves to the latest value', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 50), {
      initialProps: { value: 0 },
    });

    for (let i = 1; i <= 5000; i++) {
      rerender({ value: i });
    }

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current).toBe(5000);
  });

  it('cancels previous timers during heavy update bursts', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 0 },
    });

    for (let i = 1; i <= 1000; i++) {
      rerender({ value: i });
      act(() => {
        vi.advanceTimersByTime(1);
      });
    }

    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe(1000);
  });

  it('supports large object payloads without mutation', () => {
    vi.useFakeTimers();

    const hugeObject = {
      id: 'large',
      values: Array.from({ length: 10000 }, (_, i) => ({
        index: i,
        value: `item-${i}`,
      })),
    };

    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: {} },
    });

    rerender({ value: hugeObject });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toEqual(hugeObject);
    expect((result.current as typeof hugeObject).values).toHaveLength(10000);
  });

  it('remains stable under repeated debounce cycles', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 10), {
      initialProps: { value: 0 },
    });

    for (let cycle = 1; cycle <= 100; cycle++) {
      rerender({ value: cycle });

      act(() => {
        vi.advanceTimersByTime(10);
      });

      expect(result.current).toBe(cycle);
    }
  });
});
