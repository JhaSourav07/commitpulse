import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  const TEST_KEY = 'custom_settings_token';

  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes seamlessly with the provided default value on initial render', () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, { theme: 'dark' }));

    expect(result.current[0]).toEqual({ theme: 'dark' });
  });

  it('updates state and serializes data changes out to localStorage correctly', () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'initial_state'));

    act(() => {
      const setValue = result.current[1];
      setValue('mutated_state');
    });

    expect(result.current[0]).toBe('mutated_state');
    expect(window.localStorage.getItem(TEST_KEY)).toBe(JSON.stringify('mutated_state'));
  });

  it('hydrates state directly from pre-existing localStorage entries inside browser lifecycle', async () => {
    window.localStorage.setItem(TEST_KEY, JSON.stringify('cached_payload'));

    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'fallback_default'));

    await waitFor(() => {
      expect(result.current[0]).toBe('cached_payload');
    });
  });

  it('recovers gracefully and defaults to initial parameters when parsing corrupted JSON strings', () => {
    window.localStorage.setItem(TEST_KEY, '{invalid_json_payload:');

    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'safe_fallback'));

    expect(result.current[0]).toBe('safe_fallback');
  });

  it('safely updates internal state even when localStorage.setItem throws an error', () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'baseline_value'));

    act(() => {
      const setValue = result.current[1];
      setValue('exception_resilient_value');
    });

    expect(result.current[0]).toBe('exception_resilient_value');

    storageSpy.mockRestore();
  });
});
