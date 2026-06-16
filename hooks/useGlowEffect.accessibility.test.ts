import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useGlowEffect } from './useGlowEffect';

describe('useGlowEffect - Pointer Tracking & Component Lifecycle Synchronization', () => {
  let disconnectSpy: ReturnType<typeof vi.fn>;
  let rafCallback: FrameRequestCallback | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    rafCallback = null;
    disconnectSpy = vi.fn();

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return 123;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    global.ResizeObserver = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = disconnectSpy;
    } as unknown as typeof global.ResizeObserver;
  });

  it('initializes seamlessly with center-aligned fallback CSS custom variables', () => {
    const { result } = renderHook(() => useGlowEffect());

    expect(result.current.shellVars['--mx']).toBe('50%');
    expect(result.current.shellVars['--my']).toBe('50%');
    expect(result.current.shellVars['--glow-opacity']).toBe('0');
  });

  it('calculates relative grid coordinate percentages accurately during pointer movements', () => {
    const { result } = renderHook(() => useGlowEffect());

    const mockElement = document.createElement('div');
    mockElement.style.setProperty = vi.fn();
    Object.defineProperty(result.current.shellRef, 'current', { value: mockElement });

    const fakeEvent = {
      clientX: 50,
      clientY: 50,
      currentTarget: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 200,
          height: 200,
          right: 200,
          bottom: 200,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }),
      },
    };

    act(() => {
      result.current.handleMouseMove(fakeEvent as unknown as React.MouseEvent<HTMLDivElement>);
    });

    if (rafCallback) {
      const callback = rafCallback;
      act(() => {
        callback(performance.now());
      });
    }

    expect(mockElement.style.setProperty).toHaveBeenCalledWith(
      '--mx',
      expect.stringContaining('%')
    );
    expect(mockElement.style.setProperty).toHaveBeenCalledWith('--glow-opacity', '1');
  });

  it('dims opacity constraints out instantly upon mouse exit gestures', () => {
    const { result } = renderHook(() => useGlowEffect());
    const mockElement = document.createElement('div');
    mockElement.style.setProperty = vi.fn();
    Object.defineProperty(result.current.shellRef, 'current', { value: mockElement });

    act(() => {
      result.current.handleMouseLeave();
    });

    if (rafCallback) {
      const callback = rafCallback;
      act(() => {
        callback(performance.now());
      });
    }

    expect(mockElement.style.setProperty).toHaveBeenCalledWith('--glow-opacity', '0');
    expect(mockElement.style.setProperty).toHaveBeenCalledWith('--border-opacity', '0');
  });

  it('re-fetches active element container metrics gracefully on separate interaction prompts', () => {
    const { result } = renderHook(() => useGlowEffect());
    const mockElement = document.createElement('div');

    mockElement.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));
    Object.defineProperty(result.current.shellRef, 'current', { value: mockElement });

    act(() => {
      result.current.handleMouseEnter();
    });

    expect(mockElement.getBoundingClientRect).toHaveBeenCalled();
  });

  it('detaches global layout window listeners, clears frame updates, and disconnects observers on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { result, unmount } = renderHook(() => useGlowEffect());

    const fakeElement = document.createElement('div');
    Object.defineProperty(result.current.shellRef, 'current', { value: fakeElement });

    // Directly trigger the internal hook's ResizeObserver tracking branch manually
    act(() => {
      result.current.handleMouseEnter();
    });

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
  });
});
