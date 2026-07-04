import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

// This suite targets #7128. The originally-specified scenarios (simulated
// mouseenter/hover gestures, tooltip coordinate rendering, cursor style
// classes, mouseleave overlay hiding) describe DOM/UI interaction behavior
// that does not exist in useLocalStorage.ts, which is a plain
// storage-sync hook with no DOM/event logic. These tests instead cover
// the hook's actual behavior in a use case relevant to interactive
// UI state persistence (e.g. a "tooltipDismissed" or "lastHoveredId"
// value that a tooltip/hover component would read from and write to
// via this hook).

describe('useLocalStorage - interactive UI state persistence (#7128)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns the initial value when no interaction state has been stored yet', () => {
    const { result } = renderHook(() => useLocalStorage('tooltipDismissed', false));
    expect(result.current[0]).toBe(false);
  });

  it('reads a previously persisted interaction state on mount', () => {
    window.localStorage.setItem('tooltipDismissed', JSON.stringify(true));
    const { result } = renderHook(() => useLocalStorage('tooltipDismissed', false));
    expect(result.current[0]).toBe(true);
  });

  it('persists updated interaction state (e.g. after a hover/click event) to storage', () => {
    const { result } = renderHook(() => useLocalStorage('lastHoveredId', ''));
    act(() => {
      result.current[1]('segment-3');
    });
    expect(result.current[0]).toBe('segment-3');
    expect(window.localStorage.getItem('lastHoveredId')).toBe(JSON.stringify('segment-3'));
  });

  it('falls back to the initial value when stored interaction JSON is corrupted', () => {
    window.localStorage.setItem('lastHoveredId', '{not-valid');
    const { result } = renderHook(() => useLocalStorage('lastHoveredId', ''));
    expect(result.current[0]).toBe('');
  });

  it('does not throw and still updates in-memory state when a storage write fails during rapid interaction updates', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { result } = renderHook(() => useLocalStorage('lastHoveredId', ''));
    act(() => {
      result.current[1]('segment-7');
    });
    expect(result.current[0]).toBe('segment-7');
  });
});
