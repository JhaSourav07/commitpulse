import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce Empty Fallback Tests', () => {
  it('returns empty string immediately when initialized with empty string', () => {
    const { result } = renderHook(() => useDebounce('', 300));

    expect(result.current).toBe('');
  });

  it('preserves empty string after debounce period', () => {
    vi.useFakeTimers();

    try {
      const { result } = renderHook(() => useDebounce('', 300));

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('transitions from value to empty string after debounce delay', () => {
    vi.useFakeTimers();

    try {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
        initialProps: { value: 'octocat' },
      });

      expect(result.current).toBe('octocat');

      rerender({ value: '' });

      act(() => {
        vi.advanceTimersByTime(299);
      });

      expect(result.current).toBe('octocat');

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('handles repeated empty-string updates without throwing', () => {
    vi.useFakeTimers();

    try {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
        initialProps: { value: '' },
      });

      expect(() => {
        rerender({ value: '' });
        rerender({ value: '' });
        rerender({ value: '' });
      }).not.toThrow();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('maintains stable fallback state when toggling between empty values', () => {
    vi.useFakeTimers();

    try {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
        initialProps: { value: '' },
      });

      rerender({ value: 'a' });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      rerender({ value: '' });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });
});
