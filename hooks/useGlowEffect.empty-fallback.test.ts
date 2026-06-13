import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGlowEffect } from './useGlowEffect';

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe('useGlowEffect - Empty/Missing Inputs Verification', () => {
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

  it('initializes successfully without a DOM element', () => {
    const { result } = renderHook(() => useGlowEffect());

    expect(result.current.shellRef.current).toBeNull();
  });

  it('provides default CSS variable values in empty state', () => {
    const { result } = renderHook(() => useGlowEffect());

    expect(result.current.shellVars['--mx']).toBe('50%');
    expect(result.current.shellVars['--my']).toBe('50%');
    expect(result.current.shellVars['--glow-opacity']).toBe('0');
    expect(result.current.shellVars['--border-opacity']).toBe('0');
  });

  it('updates target coordinates from mouse movement', () => {
    const { result } = renderHook(() => useGlowEffect());

    const div = document.createElement('div');

    div.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
      }) as DOMRect;

    result.current.handleMouseMove({
      clientX: 50,
      clientY: 25,
      currentTarget: div,
    } as unknown as React.MouseEvent<HTMLDivElement>);

    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('starts glow animation when pointer enters and moves', () => {
    const { result } = renderHook(() => useGlowEffect());

    const div = document.createElement('div');

    div.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 200,
        height: 100,
      }) as DOMRect;

    result.current.handleMouseEnter();

    result.current.handleMouseMove({
      clientX: 100,
      clientY: 50,
      currentTarget: div,
    } as unknown as React.MouseEvent<HTMLDivElement>);

    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('continues animation after mouse leave', () => {
    const { result } = renderHook(() => useGlowEffect());

    result.current.handleMouseLeave();

    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('cancels animation frame on unmount after active animation', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const { result, unmount } = renderHook(() => useGlowEffect());

    const div = document.createElement('div');

    div.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
      }) as DOMRect;

    result.current.handleMouseMove({
      clientX: 40,
      clientY: 40,
      currentTarget: div,
    } as unknown as React.MouseEvent<HTMLDivElement>);

    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });
});
