import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let reducedMotion = false;

type ButtonMotionProps = {
  children?: React.ReactNode;
  whileHover?: unknown;
  whileTap?: unknown;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,

  motion: {
    div: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
    } & React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,

    span: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
    } & React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span>,

    button: ({
      children,
      whileHover: _whileHover,
      whileTap: _whileTap,
      ...props
    }: ButtonMotionProps) => {
      void _whileHover;
      void _whileTap;

      return <button {...props}>{children}</button>;
    },
    circle: (props: React.SVGProps<SVGCircleElement>) => <circle {...props} />,
  },

  useReducedMotion: () => reducedMotion,
  useScroll: () => ({ scrollYProgress: 0 }),
  useSpring: (value: unknown) => value,
  useTransform: () => 0,
}));

vi.mock('lucide-react', () => ({
  ChevronUp: () => <svg data-testid="chevron-up-icon" />,
}));

import ReturnToTop from './ReturnToTop';

describe('ReturnToTop Empty/Missing Inputs Verification', () => {
  beforeEach(() => {
    reducedMotion = false;

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value: 0,
    });

    vi.restoreAllMocks();
  });

  it('renders safely without displaying the button when page is at the top', () => {
    render(<ReturnToTop />);

    expect(screen.queryByRole('button', { name: /back to top/i })).not.toBeInTheDocument();
  });

  it('remains hidden when scroll position stays below the visibility threshold', () => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 299,
    });

    render(<ReturnToTop />);

    fireEvent.scroll(window);

    expect(screen.queryByRole('button', { name: /back to top/i })).not.toBeInTheDocument();
  });

  it('becomes visible when scroll position exceeds the visibility threshold', () => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 301,
    });

    render(<ReturnToTop />);

    fireEvent.scroll(window);

    expect(screen.getByRole('button', { name: /back to top/i })).toBeInTheDocument();
  });

  it('uses auto scrolling behavior when reduced-motion mode is enabled', () => {
    reducedMotion = true;

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 500,
    });

    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    render(<ReturnToTop />);

    fireEvent.scroll(window);
    fireEvent.click(screen.getByRole('button', { name: /back to top/i }));

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      behavior: 'auto',
    });
  });

  it('maintains stable visibility state across multiple scroll events', () => {
    render(<ReturnToTop />);

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 350,
    });

    fireEvent.scroll(window);

    expect(screen.getByRole('button', { name: /back to top/i })).toBeInTheDocument();

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 150,
    });

    fireEvent.scroll(window);

    expect(screen.queryByRole('button', { name: /back to top/i })).not.toBeInTheDocument();

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 450,
    });

    fireEvent.scroll(window);

    expect(screen.getByRole('button', { name: /back to top/i })).toBeInTheDocument();
  });
});
