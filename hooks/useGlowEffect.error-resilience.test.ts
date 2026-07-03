import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGlowEffect } from './useGlowEffect';

describe('useGlowEffect - Error Resilience', () => {
  const originalResizeObserver = global.ResizeObserver;
  const originalRequestAnimationFrame = global.requestAnimationFrame;
  const originalCancelAnimationFrame = global.cancelAnimationFrame;

  beforeEach(() => {
    global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      return setTimeout(() => cb(0), 0) as unknown as number;
    });

    global.cancelAnimationFrame = vi.fn();

    global.ResizeObserver = vi.fn(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    })) as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();

    global.ResizeObserver = originalResizeObserver;
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('renders successfully without crashing (hydration stability)', () => {
    const { result } = renderHook(() => useGlowEffect());

    expect(result.current.shellRef).toBeDefined();
    expect(result.current.shellVars).toBeDefined();
    expect(result.current.handleMouseMove).toBeTypeOf('function');
  });

  it('works correctly when ResizeObserver is unavailable', () => {
    // @ts-expect-error -- Simulate an environment where ResizeObserver is unavailable.
    delete global.ResizeObserver;

    expect(() => {
      renderHook(() => useGlowEffect());
    }).not.toThrow();
  });

  it('handles mouse movement safely even when the ref has not been initialized', () => {
    const { result } = renderHook(() => useGlowEffect());

    const event = {
      clientX: 50,
      clientY: 30,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 100,
          height: 100,
        }),
      },
    } as unknown as React.MouseEvent<HTMLDivElement>;

    expect(() => {
      act(() => {
        result.current.handleMouseMove(event);
      });
    }).not.toThrow();
  });

  it('cleans up listeners and animation frame on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useGlowEffect());

    expect(() => {
      unmount();
    }).not.toThrow();

    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
  });

  it('does not throw when mouse leave is triggered before animation starts', () => {
    const { result } = renderHook(() => useGlowEffect());

    expect(() => {
      act(() => {
        result.current.handleMouseLeave();
      });
    }).not.toThrow();
  });
});
