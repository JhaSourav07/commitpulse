import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGlowEffect } from './useGlowEffect';

describe('useGlowEffect massive scaling behavior', () => {
  let rafId = 0;

  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => ++rafId)
    );

    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maintains default CSS variables under high-load initialization', () => {
    const { result } = renderHook(() => useGlowEffect());

    expect(result.current.shellVars['--mx']).toBe('50%');
    expect(result.current.shellVars['--my']).toBe('50%');
    expect(result.current.shellVars['--glow-opacity']).toBe('0');
    expect(result.current.shellVars['--border-opacity']).toBe('0');
  });

  it('handles thousands of mouse move events without throwing', () => {
    const { result } = renderHook(() => useGlowEffect());

    const shell = document.createElement('div');

    Object.defineProperty(shell, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 1000,
        height: 1000,
      }),
    });

    result.current.shellRef.current = shell;

    expect(() => {
      for (let i = 0; i < 5000; i++) {
        act(() => {
          result.current.handleMouseMove({
            clientX: i % 1000,
            clientY: i % 1000,
            currentTarget: shell,
          } as never);
        });
      }
    }).not.toThrow();
  });

  it('accepts extreme coordinate values without breaking calculations', () => {
    const { result } = renderHook(() => useGlowEffect());

    const shell = document.createElement('div');

    Object.defineProperty(shell, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 100000,
        height: 100000,
      }),
    });

    result.current.shellRef.current = shell;

    expect(() => {
      act(() => {
        result.current.handleMouseMove({
          clientX: 99999,
          clientY: 99999,
          currentTarget: shell,
        } as never);
      });
    }).not.toThrow();
  });

  it('handles repeated enter move leave cycles under heavy load', () => {
    const { result } = renderHook(() => useGlowEffect());

    const shell = document.createElement('div');

    Object.defineProperty(shell, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 500,
        height: 500,
      }),
    });

    result.current.shellRef.current = shell;

    expect(() => {
      for (let i = 0; i < 1000; i++) {
        act(() => {
          result.current.handleMouseEnter();

          result.current.handleMouseMove({
            clientX: 250,
            clientY: 250,
            currentTarget: shell,
          } as never);

          result.current.handleMouseLeave();
        });
      }
    }).not.toThrow();
  });

  it('processes large event bursts within reasonable execution time', () => {
    const { result } = renderHook(() => useGlowEffect());

    const shell = document.createElement('div');

    Object.defineProperty(shell, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 1000,
        height: 1000,
      }),
    });

    result.current.shellRef.current = shell;

    const start = performance.now();

    for (let i = 0; i < 10000; i++) {
      act(() => {
        result.current.handleMouseMove({
          clientX: i % 1000,
          clientY: i % 1000,
          currentTarget: shell,
        } as never);
      });
    }

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1000);
  });
});
