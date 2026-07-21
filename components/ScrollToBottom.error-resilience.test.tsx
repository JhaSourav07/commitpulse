import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';

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

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <div data-testid="error-fallback">Error caught</div>;
    return this.props.children;
  }
}

describe('ScrollToBottom - Error Resilience', () => {
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<ScrollToBottom />)).not.toThrow();
  });

  it('unmounts without crashing or leaving scroll listeners behind', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ScrollToBottom />);

    expect(() => unmount()).not.toThrow();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('calls window.scrollTo safely when the button is clicked', () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    render(<ScrollToBottom />);
    fireEvent.scroll(window);

    const button = screen.getByRole('button', { name: /scroll to bottom/i });
    expect(() => fireEvent.click(button)).not.toThrow();
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
  });

  it('survives being wrapped in an error boundary without triggering it', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ScrollToBottom />
      </ErrorBoundary>
    );

    expect(screen.queryByTestId('error-fallback')).not.toBeInTheDocument();
  });

  it('stays hidden without crashing when scrollHeight equals innerHeight', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 800,
    });

    expect(() => {
      render(<ScrollToBottom />);
      fireEvent.scroll(window);
    }).not.toThrow();

    expect(screen.queryByRole('button', { name: /scroll to bottom/i })).not.toBeInTheDocument();
  });

  it('does not crash when rendered and immediately unmounted before scroll fires', () => {
    const { unmount } = render(<ScrollToBottom />);
    expect(() => unmount()).not.toThrow();
  });
});
