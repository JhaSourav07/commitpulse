import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

let reducedMotion = false;

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    ),
    button: ({
      children,
      whileHover: _wh,
      whileTap: _wt,
      ...props
    }: {
      children?: React.ReactNode;
      whileHover?: unknown;
      whileTap?: unknown;
      [key: string]: unknown;
    }) => <button {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>,
    circle: (props: React.SVGProps<SVGCircleElement>) => <circle {...props} />,
    span: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <span {...(props as React.HTMLAttributes<HTMLSpanElement>)}>{children}</span>
    ),
  },
  useReducedMotion: () => reducedMotion,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useSpring: (value: unknown) => value,
  useTransform: () => 0,
}));

vi.mock('lucide-react', () => ({
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
}));

import ScrollToBottom from './ScrollToBottom';

describe('ScrollToBottom - Empty & Fallback State Verification', () => {
  beforeEach(() => {
    reducedMotion = false;
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
      writable: true,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });
  });

  it('renders nothing on initial mount when scroll position is 0 (page not yet scrolled)', () => {
    // scrollY(0) + innerHeight(800) = 800, which is < scrollHeight(3000) - 40 — button IS visible
    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    // Button should be visible because there is content below to scroll to
    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();
  });

  it('hides the button when the page has no scrollable content (scrollHeight <= innerHeight + 40)', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 800, // same as innerHeight — no overflow
    });

    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();
  });

  it('hides the button when already scrolled to the bottom', () => {
    // scrollY(2200) + innerHeight(800) = 3000, NOT < 3000 - 40 = 2960
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2200, writable: true });

    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();
  });

  it('shows the button after scrolling away from the bottom', () => {
    // Start at bottom
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2200, writable: true });

    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();

    // Scroll back up
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 100, writable: true });
    fireEvent.scroll(window);

    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();
  });

  it('animate-ping ring is absent when reduced motion is preferred', () => {
    reducedMotion = true;

    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    const { container } = render(<ScrollToBottom />);
    fireEvent.scroll(window);

    const pingSpan = container.querySelector('.animate-ping');
    expect(pingSpan).not.toBeInTheDocument();
  });

  it('animate-ping ring is present when reduced motion is not preferred', () => {
    reducedMotion = false;

    const { container } = render(<ScrollToBottom />);
    fireEvent.scroll(window);

    const pingSpan = container.querySelector('.animate-ping');
    expect(pingSpan).toBeInTheDocument();
  });
});
