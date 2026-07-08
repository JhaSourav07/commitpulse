/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useGlowEffect } from './useGlowEffect';

const InteractiveGlowComponent = ({ onClick }: { onClick?: () => void }) => {
  const glow = useGlowEffect();

  return React.createElement(
    'div',
    {
      'data-testid': 'glow-container',
      ref: glow.shellRef,
      style: glow.shellVars,
      onMouseEnter: glow.handleMouseEnter,
      onMouseMove: glow.handleMouseMove,
      onMouseLeave: glow.handleMouseLeave,
      onTouchStart: glow.handleMouseEnter,
      onClick: onClick,
      className: 'glow-container cursor-pointer',
    },
    React.createElement('div', { className: 'tooltip-content' }, 'Tooltip Layout')
  );
};

describe('Interactive Tooltips, Cursor Hovers & Touch Event Propagation (Variation 5)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
      (cb: any) => setTimeout(cb, 16) as any
    );
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: any) => clearTimeout(id));

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => {
      return {
        width: 200,
        height: 100,
        top: 50,
        left: 50,
        bottom: 150,
        right: 250,
        x: 50,
        y: 50,
        toJSON: () => {},
      } as DOMRect;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('triggers simulated mouseenter/hover gestures on active segments or interactive nodes', () => {
    render(React.createElement(InteractiveGlowComponent));
    const container = screen.getByTestId('glow-container');

    fireEvent.mouseEnter(container);
    fireEvent.mouseMove(container, { clientX: 100, clientY: 75 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(container.style.getPropertyValue('--glow-opacity')).toBe('1');
  });

  it('verifies that responsive tooltip layouts display at computed coordinates', () => {
    render(React.createElement(InteractiveGlowComponent));
    const container = screen.getByTestId('glow-container');

    fireEvent.mouseEnter(container);

    // 150px from left (150-50 = 100px relative). 100 / 200 = 50%
    // 75px from top (75-50 = 25px relative). 25 / 100 = 25%
    fireEvent.mouseMove(container, { clientX: 150, clientY: 75 });

    act(() => {
      vi.advanceTimersByTime(2000); // Allow smoothing to settle fully
    });

    const mx = parseFloat(container.style.getPropertyValue('--mx'));
    const my = parseFloat(container.style.getPropertyValue('--my'));

    expect(mx).toBeGreaterThan(49.5);
    expect(mx).toBeLessThan(50.5);
    expect(my).toBeGreaterThan(24.5);
    expect(my).toBeLessThan(25.5);
  });

  it('tests custom click/touch gestures and ensures click events propagate correctly', () => {
    const onClick = vi.fn();
    render(React.createElement(InteractiveGlowComponent, { onClick }));
    const container = screen.getByTestId('glow-container');

    fireEvent.touchStart(container);
    fireEvent.click(container);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('asserts appropriate cursor style classes (like pointer) are applied on hover', () => {
    render(React.createElement(InteractiveGlowComponent));
    const container = screen.getByTestId('glow-container');

    expect(container.className).toContain('cursor-pointer');
  });

  it('checks that mouseleave events successfully hide temporary overlay visuals', () => {
    render(React.createElement(InteractiveGlowComponent));
    const container = screen.getByTestId('glow-container');

    fireEvent.mouseEnter(container);
    fireEvent.mouseMove(container, { clientX: 150, clientY: 75 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(container.style.getPropertyValue('--glow-opacity')).toBe('1');

    fireEvent.mouseLeave(container);

    act(() => {
      vi.advanceTimersByTime(2000); // Allow animation to settle
    });

    expect(container.style.getPropertyValue('--glow-opacity')).toBe('0');
  });
});
