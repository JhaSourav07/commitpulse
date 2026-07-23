import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';

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

describe('ScrollToBottom Accessibility Standards & ARIA Compliance', () => {
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

  it('button has aria-label="Scroll to bottom"', () => {
    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    const button = screen.getByRole('button', { name: /scroll to bottom/i });
    expect(button).toHaveAttribute('aria-label', 'Scroll to bottom');
  });

  it('button is a native <button> element — keyboard accessible by default', () => {
    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    const button = screen.getByRole('button', { name: /scroll to bottom/i });
    expect(button.tagName).toBe('BUTTON');
  });

  it('decorative SVG progress ring has aria-hidden="true"', () => {
    const { container } = render(<ScrollToBottom />);
    fireEvent.scroll(window);

    const hiddenSvg = container.querySelector('svg[aria-hidden="true"]');
    expect(hiddenSvg).toBeInTheDocument();
  });

  it('button is keyboard focusable via tab', async () => {
    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    const user = userEvent.setup();
    await user.tab();

    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toHaveFocus();
  });

  it('has focus-visible outline classes for keyboard users', () => {
    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    const button = screen.getByRole('button', { name: /scroll to bottom/i });
    expect(button.className).toContain('focus-visible:outline');
    expect(button.className).toContain('focus-visible:outline-violet-400');
  });

  it('ChevronDown icon inside the button is aria-hidden via motion.span', () => {
    const { container } = render(<ScrollToBottom />);
    fireEvent.scroll(window);

    // The span wrapping the icon has aria-hidden="true"
    const hiddenSpan = container.querySelector('span[aria-hidden="true"]');
    expect(hiddenSpan).toBeInTheDocument();
  });
});
