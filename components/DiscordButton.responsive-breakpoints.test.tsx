import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { DiscordButton } from './DiscordButton';
import gsap from 'gsap';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: React.ComponentProps<'div'>) => <div {...props} />,
    a: (props: React.ComponentProps<'a'>) => <a {...props} />,
  },
}));

// Mock gsap
vi.mock('gsap', () => ({
  default: {
    to: vi.fn(),
  },
}));

describe('DiscordButton - Responsive Breakpoints & Mobile Layouts', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('Mobile Viewport Simulation: renders without crashing on 375px mobile viewport', () => {
    // Mock mobile viewport width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));

    const { container } = render(<DiscordButton />);

    // Verify component renders in mobile context
    expect(container).toBeTruthy();

    // Verify link is still accessible on mobile
    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://discord.gg/f84SDraEBH');
  });

  it('Responsive Column Reflow: maintains inline-flex layout with responsive gap spacing on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { container } = render(<DiscordButton />);

    // Find the main button link
    const link = container.querySelector('a');
    expect(link?.className).toContain('inline-flex');
    expect(link?.className).toContain('gap-3');

    // Ensure button stays inline and doesn't stack vertically on mobile
    expect(link?.className).not.toContain('flex-col');
  });

  it('Horizontal Overflow Prevention: strictly bounds wrapper without fixed absolute widths causing overflow', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { container } = render(<DiscordButton />);

    // Find the outer wrapper
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('relative');
    expect(wrapper.className).toContain('inline-block');

    // Verify no fixed pixel widths that would cause horizontal scrolling
    expect(wrapper.className).not.toMatch(/w-\[\d+px\]/);

    // Find the button link and verify overflow is clipped
    const link = container.querySelector('a');
    expect(link?.className).toContain('overflow-hidden');
  });

  it('Navigation / Interactive Element Scaling: preserves touch-friendly padding and click targets on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { container } = render(<DiscordButton />);

    // Find the button link
    const link = container.querySelector('a');

    // Verify responsive padding maintains large touch targets
    expect(link?.className).toContain('px-5');
    expect(link?.className).toContain('py-2');

    // Verify rounded-full maintains clickable area
    expect(link?.className).toContain('rounded-full');

    // Verify text size is appropriately scaled for readability
    expect(link?.className).toContain('text-sm');
  });

  it('Mobile Toggle & State Responsiveness: handles hover and tap states correctly within mobile viewport constraints', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { container } = render(<DiscordButton />);

    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();

    // Simulate mouse enter (hover state on mobile)
    fireEvent.mouseEnter(link as Element);

    // Simulate mouse move while hovered - this triggers GSAP animation
    fireEvent.mouseMove(link as Element, {
      clientX: 50,
      clientY: 75,
    });

    // Verify GSAP animation was triggered for hover effect on mobile viewport
    expect(gsap.to).toHaveBeenCalled();

    // Clear mocks to verify the leave event
    vi.clearAllMocks();

    // Simulate mouse leave (reset state)
    fireEvent.mouseLeave(link as Element);

    // Verify GSAP resets transforms on leave within mobile viewport
    expect(gsap.to).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
      })
    );
  });
});
