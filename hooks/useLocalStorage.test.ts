import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns the initial value when storage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('username', ''));

    expect(result.current[0]).toBe('');
  });

  it('loads an existing value from localStorage', async () => {
    localStorage.setItem('username', JSON.stringify('ganesh'));

    const { result } = renderHook(() => useLocalStorage('username', ''));

    await waitFor(() => {
      expect(result.current[0]).toBe('ganesh');
    });
  });

  it('writes updates to localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const { result } = renderHook(() => useLocalStorage('username', ''));

    act(() => {
      result.current[1]('ganesh');
    });

    expect(result.current[0]).toBe('ganesh');

    expect(setItemSpy).toHaveBeenCalledWith('username', JSON.stringify('ganesh'));
  });

  it('falls back to initial value when getItem throws', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    const { result } = renderHook(() => useLocalStorage('username', 'fallback'));

    expect(result.current[0]).toBe('fallback');
  });

  it('does not crash when setItem throws', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    const { result } = renderHook(() => useLocalStorage('username', ''));

    expect(() => {
      act(() => {
        result.current[1]('ganesh');
      });
    }).not.toThrow();

    expect(result.current[0]).toBe('ganesh');
  });

  it('supports generic object values', async () => {
    const user = {
      name: 'Ganesh',
      score: 100,
    };

    localStorage.setItem('user', JSON.stringify(user));

    const { result } = renderHook(() =>
      useLocalStorage<typeof user>('user', {
        name: '',
        score: 0,
      })
    );

    await waitFor(() => {
      expect(result.current[0]).toEqual(user);
    });
  });
});
