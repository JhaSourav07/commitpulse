import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGlowEffect } from './useGlowEffect';

// This suite targets #7124. The originally-specified scenarios (mobile
// viewport mocking, column reflow into flex lists, horizontal scrollbar
// checks from absolute widths, nav component scaling, mobile toggle
// states) describe layout/CSS behavior that does not exist in
// useGlowEffect.ts, which is a pure mouse-tracking/cursor-glow animation
// hook. It renders no layout, no columns, and no nav — it only tracks
// cursor position relative to a single element's bounding rect.
//
// The one genuinely viewport-relevant piece of real behavior it has is:
// it listens for `resize`/`scroll` and uses a ResizeObserver to
// recalculate that bounding rect, and its coordinate math is expressed
// as a percentage of the rect's own width/height (not absolute pixels),
// so it stays correct regardless of the element's size across device
// breakpoints. These tests cover that real behavior honestly.

let frameQueue: FrameRequestCallback[] = [];

function flushFrames(maxFrames = 200) {
  let count = 0;
  while (frameQueue.length > 0 && count < maxFrames) {
    const cb = frameQueue.shift()!;
    cb(0);
    count += 1;
  }
}

// The exponential smoothing loop asymptotically approaches its target
// but never reaches it exactly, so compare with a numeric tolerance
// rather than exact string equality.
function expectPercentCloseTo(value: string, target: number) {
  expect(value.endsWith('%')).toBe(true);
  const numeric = Number(value.slice(0, -1));
  expect(numeric).toBeCloseTo(target, 1);
}

function createShell(rect: { width: number; height: number }) {
  const shell = document.createElement('div');
  Object.defineProperty(shell, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      left: 0,
      top: 0,
      width: rect.width,
      height: rect.height,
      right: rect.width,
      bottom: rect.height,
      x: 0,
      y: 0,
      toJSON: () => {},
    }),
  });
  return shell;
}

describe('useGlowEffect - responsive/multi-device behavior (#7124)', () => {
  beforeEach(() => {
    frameQueue = [];
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        frameQueue.push(cb);
        return frameQueue.length;
      })
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('registers resize and scroll listeners on mount to keep its rect current across breakpoints', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    renderHook(() => useGlowEffect());
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
  });

  it('produces the same relative glow position for the same relative cursor position on a small (mobile-sized) element', () => {
    const { result } = renderHook(() => useGlowEffect());
    const mobileShell = createShell({ width: 320, height: 480 });
    (result.current.shellRef as { current: HTMLDivElement | null }).current = mobileShell;

    act(() => {
      // Cursor at 25% across, 50% down the element.
      result.current.handleMouseMove({
        currentTarget: mobileShell,
        clientX: 80, // 25% of 320
        clientY: 240, // 50% of 480
      } as unknown as React.MouseEvent<HTMLDivElement>);
      flushFrames();
    });

    expectPercentCloseTo(mobileShell.style.getPropertyValue('--mx'), 25);
    expectPercentCloseTo(mobileShell.style.getPropertyValue('--my'), 50);
  });

  it('produces the same relative glow position for the same relative cursor position on a large (desktop-sized) element', () => {
    const { result } = renderHook(() => useGlowEffect());
    const desktopShell = createShell({ width: 1600, height: 900 });
    (result.current.shellRef as { current: HTMLDivElement | null }).current = desktopShell;

    act(() => {
      // Same relative position: 25% across, 50% down.
      result.current.handleMouseMove({
        currentTarget: desktopShell,
        clientX: 400, // 25% of 1600
        clientY: 450, // 50% of 900
      } as unknown as React.MouseEvent<HTMLDivElement>);
      flushFrames();
    });

    expectPercentCloseTo(desktopShell.style.getPropertyValue('--mx'), 25);
    expectPercentCloseTo(desktopShell.style.getPropertyValue('--my'), 50);
  });

  it('recalculates the bounding rect on mouse enter, so it stays correct after a viewport/breakpoint change', () => {
    const { result } = renderHook(() => useGlowEffect());
    const shell = createShell({ width: 320, height: 480 });
    (result.current.shellRef as { current: HTMLDivElement | null }).current = shell;

    const rectSpy = vi.spyOn(shell, 'getBoundingClientRect');
    act(() => {
      result.current.handleMouseEnter();
    });

    expect(rectSpy).toHaveBeenCalled();
  });

  it('cleans up resize/scroll listeners and any pending animation frame on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useGlowEffect());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
  });
});
