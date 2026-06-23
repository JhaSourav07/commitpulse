import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce theme contrast cohesion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('preserves dark theme token until debounce delay completes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'dark' },
    });

    rerender({ value: 'light' });

    expect(result.current).toBe('dark');
  });

  it('updates to light theme token after debounce delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'dark' },
    });

    rerender({ value: 'light' });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('light');
  });

  it('resets timer when theme preference changes repeatedly', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'dark' },
    });

    rerender({ value: 'light' });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: 'dark' });

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(result.current).toBe('dark');
  });

  it('supports custom theme objects used for styling systems', () => {
    const darkTheme = {
      background: '#0f172a',
      foreground: '#f8fafc',
    };

    const { result } = renderHook(() => useDebounce(darkTheme, 300));

    expect(result.current).toEqual(darkTheme);
  });

  it('handles overlay style tokens without clipping updates', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 'overlay-dark' },
    });

    rerender({ value: 'overlay-light' });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe('overlay-light');
  });
});
