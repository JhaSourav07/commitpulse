import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage - Empty & Fallback Edge Cases', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('handles empty array as initial value', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('list', []));

    expect(result.current[0]).toEqual([]);

    act(() => {
      result.current[1](['item1']);
    });

    expect(result.current[0]).toEqual(['item1']);
    expect(JSON.parse(localStorage.getItem('list') || '[]')).toEqual(['item1']);
  });

  it('handles null as initial value', () => {
    const { result } = renderHook(() => useLocalStorage<string | null>('user', null));

    expect(result.current[0]).toBeNull();

    act(() => {
      result.current[1]('ganesh');
    });

    expect(result.current[0]).toBe('ganesh');
    expect(JSON.parse(localStorage.getItem('user') || 'null')).toBe('ganesh');
  });

  it('handles empty object as initial value', () => {
    const { result } = renderHook(() => useLocalStorage<Record<string, unknown>>('config', {}));

    expect(result.current[0]).toEqual({});

    act(() => {
      result.current[1]({ theme: 'dark' });
    });

    expect(result.current[0]).toEqual({ theme: 'dark' });
    expect(JSON.parse(localStorage.getItem('config') || '{}')).toEqual({ theme: 'dark' });
  });

  it('falls back when localStorage key does not exist', () => {
    const { result } = renderHook(() => useLocalStorage('missing-key', 'default'));

    expect(result.current[0]).toBe('default');
  });

  it('gracefully falls back from corrupted JSON and recovers after update', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const key = 'corrupted';
    const initial = { a: 1 };
    localStorage.setItem(key, 'invalid-json-{');

    const { result } = renderHook(() => useLocalStorage(key, initial));

    // Fallback to initial value
    expect(result.current[0]).toEqual(initial);

    // Verify recovery: setting a new value should overwrite corrupted data
    act(() => {
      result.current[1]({ a: 2 });
    });

    expect(result.current[0]).toEqual({ a: 2 });
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ a: 2 });

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
