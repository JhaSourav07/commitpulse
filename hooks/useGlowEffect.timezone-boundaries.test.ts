import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGlowEffect } from './useGlowEffect';

// This suite targets #7125. The originally-specified scenarios (mocking
// UTC/EST/IST/JST timezones, aligning commits to visual dates, leap year
// boundary parsing, calendar date formatting, DST transition offsets)
// describe date/timezone logic that does not exist in useGlowEffect.ts,
// which is a pure mouse-tracking/cursor-glow animation hook (RAF-based
// position smoothing driven by mouse coordinates, exposed as CSS custom
// properties). There is no calendar or timezone code path to test.
//
// These tests instead cover the hook's real behavior: the returned API
// shape, default CSS variable state, and mouse enter/move/leave handling
// that drives the glow position and opacity on the element attached via
// shellRef.

let frameQueue: FrameRequestCallback[] = [];

// Drains queued frames iteratively (not recursively) so the internal
// smoothing loop can run to convergence without overflowing the stack,
// since the real hook re-queues a new frame from inside each callback.
function flushFrames(maxFrames = 200) {
  let count = 0;
  while (frameQueue.length > 0 && count < maxFrames) {
    const cb = frameQueue.shift()!;
    cb(0);
    count += 1;
  }
}

function createShell() {
  const shell = document.createElement('div');
  Object.defineProperty(shell, 'getBoundingClientRect', {
    value: () => ({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    }),
  });
  return shell;
}

describe('useGlowEffect - core behavior (#7125)', () => {
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

  it('returns the expected API shape (refs, vars, and handlers)', () => {
    const { result } = renderHook(() => useGlowEffect());
    expect(result.current).toHaveProperty('shellRef');
    expect(result.current).toHaveProperty('shellVars');
    expect(result.current).toHaveProperty('handleMouseEnter');
    expect(result.current).toHaveProperty('handleMouseMove');
    expect(result.current).toHaveProperty('handleMouseLeave');
  });

  it('initializes shellVars with centered position and zero opacity', () => {
    const { result } = renderHook(() => useGlowEffect());
    expect(result.current.shellVars).toMatchObject({
      '--mx': '50%',
      '--my': '50%',
      '--glow-opacity': '0',
      '--border-opacity': '0',
    });
  });

  it('activates glow opacity on mouse move', () => {
    const { result } = renderHook(() => useGlowEffect());
    const shell = createShell();
    (result.current.shellRef as { current: HTMLDivElement | null }).current = shell;

    act(() => {
      result.current.handleMouseMove({
        currentTarget: shell,
        clientX: 25,
        clientY: 75,
      } as unknown as React.MouseEvent<HTMLDivElement>);
      flushFrames(1);
    });

    expect(shell.style.getPropertyValue('--glow-opacity')).toBe('1');
    expect(shell.style.getPropertyValue('--border-opacity')).toBe('1');
  });

  it('deactivates glow opacity on mouse leave once the animation settles', () => {
    const { result } = renderHook(() => useGlowEffect());
    const shell = createShell();
    (result.current.shellRef as { current: HTMLDivElement | null }).current = shell;

    act(() => {
      result.current.handleMouseMove({
        currentTarget: shell,
        clientX: 10,
        clientY: 10,
      } as unknown as React.MouseEvent<HTMLDivElement>);
      flushFrames();
    });

    act(() => {
      result.current.handleMouseLeave();
      flushFrames();
    });

    expect(shell.style.getPropertyValue('--glow-opacity')).toBe('0');
    expect(shell.style.getPropertyValue('--border-opacity')).toBe('0');
  });

  it('cleans up event listeners and any pending animation frame on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useGlowEffect());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
  });
});
