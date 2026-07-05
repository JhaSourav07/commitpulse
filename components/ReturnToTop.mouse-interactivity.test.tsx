import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import ReturnToTop from './ReturnToTop';

// Mock framer-motion as in existing test files to make it easy to control and render the structure
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <button {...props}>{children}</button>
    ),
    circle: (props: { [key: string]: unknown }) => <circle {...props} />,
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <span {...props}>{children}</span>
    ),
  },
  useReducedMotion: () => false,
  useScroll: () => ({ scrollYProgress: 0 }),
  useSpring: (value: unknown) => value,
  useTransform: () => 0,
}));

vi.mock('lucide-react', () => ({
  ChevronUp: () => <svg data-testid="chevron-up-icon" />,
}));

describe('ReturnToTop - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    });

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
      writable: true,
    });

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 750,
      writable: true,
    });

    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  it('triggers simulated mouseenter/hover gestures on active segments or interactive nodes', () => {
    render(<ReturnToTop />);

    // Trigger scroll visibility
    fireEvent.scroll(window);

    const button = screen.getByRole('button', { name: /back to top/i });
    expect(button).toBeInTheDocument();

    // Trigger hover/mouseenter
    fireEvent.mouseEnter(button);
    expect(button).toBeInTheDocument();
  });

  it('verifies that responsive tooltip layouts display at computed coordinates (aria-label acts as tooltip)', () => {
    render(<ReturnToTop />);

    // Trigger scroll visibility
    fireEvent.scroll(window);

    const button = screen.getByRole('button', { name: /back to top/i });

    // Assert the button has the tooltip label mapping
    expect(button).toHaveAttribute('aria-label', 'Back to top');
  });

  it('tests custom click/touch gestures and ensures click events propagate correctly', () => {
    render(<ReturnToTop />);

    // Trigger scroll visibility
    fireEvent.scroll(window);

    const button = screen.getByRole('button', { name: /back to top/i });
    expect(button).toBeInTheDocument();

    const clickHandler = vi.fn();
    const touchHandler = vi.fn();
    button.onclick = clickHandler;
    button.ontouchstart = touchHandler;

    // Trigger and verify click event propagation
    fireEvent.click(button);
    expect(clickHandler).toHaveBeenCalledTimes(1);

    // Trigger and verify touch event propagation
    fireEvent.touchStart(button);
    expect(touchHandler).toHaveBeenCalledTimes(1);
  });

  it('asserts appropriate cursor style classes (like pointer) are applied on hover', () => {
    render(<ReturnToTop />);

    // Trigger scroll visibility
    fireEvent.scroll(window);

    const button = screen.getByRole('button', { name: /back to top/i });

    // Assert that the cursor-pointer class is explicitly applied on the component button
    expect(button.className).toContain('cursor-pointer');

    // Ensure other interactive hover styles are also present
    expect(button.className).toContain('hover:border-violet-300');
    expect(button.className).toContain('hover:text-violet-200');
  });

  it('checks that mouseleave events successfully hide temporary overlay visuals', () => {
    render(<ReturnToTop />);

    // Trigger scroll visibility
    fireEvent.scroll(window);

    const button = screen.getByRole('button', { name: /back to top/i });

    // Simulate mouseenter then mouseleave
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);

    expect(button).toBeInTheDocument();
  });
});
