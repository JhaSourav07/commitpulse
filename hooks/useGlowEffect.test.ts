import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGlowEffect } from './useGlowEffect';

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe('useGlowEffect', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns the public API for the glow effect', () => {
    const { result } = renderHook(() => useGlowEffect());

    expect(result.current.shellRef).toBeDefined();
    expect(result.current.shellVars).toBeDefined();
    expect(result.current.handleMouseEnter).toEqual(expect.any(Function));
    expect(result.current.handleMouseMove).toEqual(expect.any(Function));
    expect(result.current.handleMouseLeave).toEqual(expect.any(Function));
  });

  it('returns CSS variable keys in shellVars', () => {
    const { result } = renderHook(() => useGlowEffect());

    expect(result.current.shellVars).toHaveProperty('--mx');
    expect(result.current.shellVars).toHaveProperty('--my');
    expect(result.current.shellVars).toHaveProperty('--glow-opacity');
    expect(result.current.shellVars).toHaveProperty('--border-opacity');
  });

  it('defaults glow opacity to 0', () => {
    const { result } = renderHook(() => useGlowEffect());

    expect(result.current.shellVars['--glow-opacity']).toBe('0');
  });

  it('cancels animation frame on unmount after pointer movement', () => {
    const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const { result, unmount } = renderHook(() => useGlowEffect());

    result.current.handleMouseMove({
      clientX: 100,
      clientY: 50,
      currentTarget: document.createElement('div'),
    } as unknown as React.MouseEvent<HTMLDivElement>);

    unmount();

    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });
});
