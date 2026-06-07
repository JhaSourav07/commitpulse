import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { CommitPulseLogo } from './commitpulse-logo';

// Mock wrapper component to simulate interactivity around the logo
const InteractiveLogoWrapper = ({
  onClick,
  onTouchStart,
}: {
  onClick?: () => void;
  onTouchStart?: () => void;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    setShowTooltip(true);
    setCoordinates({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div
      data-testid="logo-wrapper"
      className="relative inline-block cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onTouchStart={onTouchStart}
    >
      <CommitPulseLogo className="hover:opacity-80 transition-opacity" />
      {showTooltip && (
        <div
          data-testid="logo-tooltip"
          className="absolute z-10 p-2 bg-black text-white rounded shadow-lg"
          style={{ top: coordinates.y + 10, left: coordinates.x + 10 }}
        >
          CommitPulse Interactive Logo
        </div>
      )}
    </div>
  );
};

describe('CommitPulseLogo - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  it('triggers simulated mouseenter/hover gestures and displays responsive tooltip layouts at computed coordinates', () => {
    render(<InteractiveLogoWrapper />);

    const wrapper = screen.getByTestId('logo-wrapper');

    // Tooltip shouldn't be visible initially
    expect(screen.queryByTestId('logo-tooltip')).toBeNull();

    // Trigger mouseenter with specific client coordinates
    fireEvent.mouseEnter(wrapper, { clientX: 150, clientY: 200 });

    const tooltip = screen.getByTestId('logo-tooltip');
    expect(tooltip).toBeTruthy();
    expect(tooltip.style.left).toBe('160px');
    expect(tooltip.style.top).toBe('210px');
    expect(tooltip.textContent).toBe('CommitPulse Interactive Logo');
  });

  it('tests custom click gestures and ensures click events propagate correctly', () => {
    const handleClick = vi.fn();
    render(<InteractiveLogoWrapper onClick={handleClick} />);

    const wrapper = screen.getByTestId('logo-wrapper');
    const svg = wrapper.querySelector('svg');

    expect(svg).toBeTruthy();

    // Click on the SVG and verify event bubbles up
    if (svg) fireEvent.click(svg);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('tests custom touch gestures and ensures touch events propagate correctly', () => {
    const handleTouch = vi.fn();
    render(<InteractiveLogoWrapper onTouchStart={handleTouch} />);

    const wrapper = screen.getByTestId('logo-wrapper');
    const svg = wrapper.querySelector('svg');

    expect(svg).toBeTruthy();

    // Touch on the SVG and verify event bubbles up
    if (svg) fireEvent.touchStart(svg, { touches: [{ clientX: 100, clientY: 100 }] });
    expect(handleTouch).toHaveBeenCalledTimes(1);
  });

  it('asserts appropriate cursor style classes (like pointer) are applied on hover wrapper', () => {
    render(<InteractiveLogoWrapper />);
    const wrapper = screen.getByTestId('logo-wrapper');

    // Check if cursor-pointer utility class is present
    expect(wrapper.className).toContain('cursor-pointer');

    const svg = wrapper.querySelector('svg');
    // Ensure hover state transition utility is present on the SVG itself
    expect(svg?.getAttribute('class')).toContain('hover:opacity-80');
  });

  it('checks that mouseleave events successfully hide temporary overlay visuals', () => {
    render(<InteractiveLogoWrapper />);
    const wrapper = screen.getByTestId('logo-wrapper');

    // Show tooltip
    fireEvent.mouseEnter(wrapper, { clientX: 50, clientY: 50 });
    expect(screen.queryByTestId('logo-tooltip')).toBeTruthy();

    // Hide tooltip
    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByTestId('logo-tooltip')).toBeNull();
  });
});
