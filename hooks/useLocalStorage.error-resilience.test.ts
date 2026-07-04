import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage - Error Resilience', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('falls back to the initial value when stored JSON is malformed', () => {
    vi.spyOn(window.localStorage, 'getItem').mockReturnValue('{invalid-json');

    const { result } = renderHook(() => useLocalStorage('username', 'fallback'));

    expect(result.current[0]).toBe('fallback');
  });

  it('falls back to the initial value when getItem throws a DOMException', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage blocked');
    });

    const { result } = renderHook(() => useLocalStorage('username', 'fallback'));

    expect(result.current[0]).toBe('fallback');
  });

  it('continues updating React state when repeated setItem calls fail', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    const { result } = renderHook(() => useLocalStorage('username', ''));

    act(() => result.current[1]('A'));
    expect(result.current[0]).toBe('A');

    act(() => result.current[1]('B'));
    expect(result.current[0]).toBe('B');

    act(() => result.current[1]('C'));
    expect(result.current[0]).toBe('C');
  });

  it('recovers after an initial read failure when the key changes', async () => {
    const getItemSpy = vi.spyOn(window.localStorage, 'getItem');

    getItemSpy
      .mockImplementationOnce(() => {
        throw new Error('Storage unavailable');
      })
      .mockReturnValueOnce(JSON.stringify('recovered'));

    const { result, rerender } = renderHook(({ keyName }) => useLocalStorage(keyName, 'fallback'), {
      initialProps: {
        keyName: 'user1',
      },
    });

    expect(result.current[0]).toBe('fallback');

    rerender({
      keyName: 'user2',
    });

    await waitFor(() => {
      expect(result.current[0]).toBe('recovered');
    });
  });

  it('continues working after a failed write once storage becomes available again', () => {
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem');

    setItemSpy
      .mockImplementationOnce(() => {
        throw new Error('Quota exceeded');
      })
      .mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage('username', ''));

    act(() => {
      result.current[1]('first');
    });

    expect(result.current[0]).toBe('first');

    act(() => {
      result.current[1]('second');
    });

    expect(result.current[0]).toBe('second');

    expect(setItemSpy).toHaveBeenCalledTimes(2);
  });
});
