import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce accessibility behavior', () => {
  it('returns the initial value immediately for accessible input text', () => {
    const { result } = renderHook(() => useDebounce('screen reader query', 300));

    expect(result.current).toBe('screen reader query');
  });

  it('keeps the previous value before the debounce delay completes', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'aria label', delay: 300 },
    });

    rerender({ value: 'aria description', delay: 300 });

    expect(result.current).toBe('aria label');

    vi.useRealTimers();
  });

  it('updates the value after the debounce delay completes', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'keyboard focus', delay: 300 },
    });

    rerender({ value: 'screen reader announcement', delay: 300 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('screen reader announcement');

    vi.useRealTimers();
  });

  it('clears the previous timer when value changes quickly', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'heading level', delay: 300 },
    });

    rerender({ value: 'tooltip label', delay: 300 });
    rerender({ value: 'visible focus outline', delay: 300 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('visible focus outline');

    vi.useRealTimers();
  });

  it('supports debouncing non-string accessibility state values', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: {
        value: { expanded: false, selectedIndex: 0 },
        delay: 200,
      },
    });

    rerender({
      value: { expanded: true, selectedIndex: 1 },
      delay: 200,
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toEqual({
      expanded: true,
      selectedIndex: 1,
    });

    vi.useRealTimers();
  });
});
