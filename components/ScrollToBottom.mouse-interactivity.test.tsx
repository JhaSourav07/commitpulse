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

describe('ScrollToBottom - Mouse Interactions & Scroll-Based Visibility', () => {
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
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  it('is visible when not scrolled to the bottom', () => {
    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();
  });

  it('is not visible when already at the bottom (scrolled + innerHeight >= scrollHeight - 40)', () => {
    // scrollY(2200) + innerHeight(800) = 3000 which is NOT < scrollHeight(3000) - 40
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2200, writable: true });

    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();
  });

  it('calls window.scrollTo with smooth behavior on click (motion enabled)', () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    fireEvent.click(screen.getByRole('button', { name: /scroll to bottom/i }));

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  });

  it('calls window.scrollTo with behavior: "auto" when reduced motion is preferred', () => {
    reducedMotion = true;
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    fireEvent.click(screen.getByRole('button', { name: /scroll to bottom/i }));

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: document.documentElement.scrollHeight,
      behavior: 'auto',
    });
  });

  it('button responds to mouseenter without throwing', () => {
    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    const button = screen.getByRole('button', { name: /scroll to bottom/i });
    expect(() => fireEvent.mouseEnter(button)).not.toThrow();
  });

  it('button responds to mouseleave without throwing', () => {
    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    const button = screen.getByRole('button', { name: /scroll to bottom/i });
    fireEvent.mouseEnter(button);
    expect(() => fireEvent.mouseLeave(button)).not.toThrow();
  });

  it('hides button when scrolled near bottom, shows again when scrolled back up', () => {
    render(<ScrollToBottom />);

    // Not at bottom — visible
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0, writable: true });
    fireEvent.scroll(window);
    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();

    // At bottom — hidden
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 2200, writable: true });
    fireEvent.scroll(window);
    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();

    // Scrolled back up — visible again
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0, writable: true });
    fireEvent.scroll(window);
    expect(screen.getByRole('button', { name: /scroll to bottom/i })).toBeInTheDocument();
  });
});
