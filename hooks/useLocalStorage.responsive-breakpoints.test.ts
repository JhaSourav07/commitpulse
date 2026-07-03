import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

// This suite targets #7130. The originally-specified scenarios (viewport
// reflow, horizontal scrollbar checks, nav scaling, mobile toggle states)
// are UI/layout concerns that do not apply to useLocalStorage, which is a
// plain storage-sync hook with no DOM/viewport logic. These tests instead
// cover the hook's actual behavior under conditions relevant to
// multi-device usage: persisting and restoring layout/preference state
// (e.g. a "columns" or "mobileNavOpen" style value) across renders,
// exactly as a responsive component would rely on it.

describe('useLocalStorage - responsive/multi-device state persistence (#7130)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns the initial value when no stored value exists (e.g. first mobile load)', () => {
    const { result } = renderHook(() => useLocalStorage('columns-layout', 'single-column'));
    expect(result.current[0]).toBe('single-column');
  });

  it('reads and parses a previously persisted layout value on mount', () => {
    window.localStorage.setItem('columns-layout', JSON.stringify('multi-column'));
    const { result } = renderHook(() => useLocalStorage('columns-layout', 'single-column'));
    expect(result.current[0]).toBe('multi-column');
  });

  it('persists a new value (e.g. switching layouts on breakpoint change) to storage', () => {
    const { result } = renderHook(() => useLocalStorage('columns-layout', 'single-column'));
    act(() => {
      result.current[1]('multi-column');
    });
    expect(result.current[0]).toBe('multi-column');
    expect(window.localStorage.getItem('columns-layout')).toBe(JSON.stringify('multi-column'));
  });

  it('falls back to the initial value when stored JSON is corrupted', () => {
    window.localStorage.setItem('mobileNavOpen', 'not-valid-json{');
    const { result } = renderHook(() => useLocalStorage('mobileNavOpen', false));
    expect(result.current[0]).toBe(false);
  });

  it('does not throw and still updates in-memory state when storage writes fail (e.g. private browsing / quota exceeded)', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { result } = renderHook(() => useLocalStorage('mobileNavOpen', false));
    act(() => {
      result.current[1](true);
    });
    expect(result.current[0]).toBe(true);
  });
});
