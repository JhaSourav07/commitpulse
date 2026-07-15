import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReturnToTop from './ReturnToTop';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import '@testing-library/jest-dom';

// 1. Mock framer-motion and lucide-react to inject exceptions
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  const React = await import('react');
  return {
    ...actual,
    motion: new Proxy(
      {},
      {
        get: (_target: Record<string, unknown>, tag: string) =>
          function MotionComponent({ children, ...props }: React.HTMLAttributes<HTMLElement>) {
            return React.createElement(tag, props, children);
          },
      }
    ),
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    useScroll: vi.fn(() => ({ scrollYProgress: 0 })),
    useSpring: vi.fn(() => 0),
    useTransform: vi.fn(() => 0),
    useReducedMotion: vi.fn(() => false),
  };
});

// We can mock ChevronUp to throw an error if a certain condition is met
vi.mock('lucide-react', () => ({
  ChevronUp: ({ className }: { className?: string }) => {
    if (window.__THROW_CHILD_EXCEPTION__) {
      throw new Error('Database connectivity error or unexpected runtime exception');
    }
    return <svg data-testid="chevron-up" className={className} />;
  },
}));

// Setup global variable for test triggers
declare global {
  interface Window {
    __THROW_CHILD_EXCEPTION__?: boolean;
    __TELEMETRY_TRACKER__?: (error: Error, info: ErrorInfo) => void;
  }
}

// Error Boundary for encasing execution calls
class LocalizedErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (window.__TELEMETRY_TRACKER__) {
      window.__TELEMETRY_TRACKER__(error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="recovery-ui">
          <h1>Clean Error Recovery UI</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={this.resetErrorBoundary}>Reset/Reload Path</button>
        </div>
      );
    }
    return this.props.children;
  }
}

describe('ReturnToTop Hydration Stability & Error Resilience', () => {
  let originalScrollY: number;

  beforeEach(() => {
    window.__THROW_CHILD_EXCEPTION__ = false;
    // Suppress console.error from ErrorBoundary during expected error throwing
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate scrolling so the button shows up immediately upon render
    originalScrollY = window.scrollY;
    Object.defineProperty(window, 'scrollY', { value: 400, writable: true });
    fireEvent.scroll(window);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.__THROW_CHILD_EXCEPTION__;
    delete window.__TELEMETRY_TRACKER__;
    Object.defineProperty(window, 'scrollY', { value: originalScrollY, writable: true });
  });

  it('mocks nested child properties to throw unexpected runtime exceptions or database connectivity errors', () => {
    window.__THROW_CHILD_EXCEPTION__ = true;

    // By simulating an unexpected connectivity/runtime exception inside a child element,
    // it triggers a render crash that can be caught by boundaries
    expect(() => {
      render(<ReturnToTop />);
    }).toThrow('Database connectivity error or unexpected runtime exception');
  });

  it('encases execution calls in localized boundary elements', () => {
    window.__THROW_CHILD_EXCEPTION__ = true;

    // Encase execution inside our LocalizedErrorBoundary
    expect(() => {
      render(
        <LocalizedErrorBoundary>
          <ReturnToTop />
        </LocalizedErrorBoundary>
      );
    }).not.toThrow();
  });

  it('asserts that target modules render a clean error recovery UI instead of crashing the site', () => {
    window.__THROW_CHILD_EXCEPTION__ = true;

    render(
      <LocalizedErrorBoundary>
        <ReturnToTop />
      </LocalizedErrorBoundary>
    );

    // Confirm the clean recovery interface is presented instead of throwing a blank white screen
    expect(screen.getByTestId('recovery-ui')).toBeInTheDocument();
    expect(screen.getByText('Clean Error Recovery UI')).toBeInTheDocument();
  });

  it('verifies exceptions are logged to dev-telemetry trackers appropriately', () => {
    window.__THROW_CHILD_EXCEPTION__ = true;
    const telemetryTracker = vi.fn();
    window.__TELEMETRY_TRACKER__ = telemetryTracker;

    render(
      <LocalizedErrorBoundary>
        <ReturnToTop />
      </LocalizedErrorBoundary>
    );

    // Assert the boundary invokes the background telemetry tracker gracefully
    expect(telemetryTracker).toHaveBeenCalledTimes(1);
    expect(telemetryTracker.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(telemetryTracker.mock.calls[0][0].message).toBe(
      'Database connectivity error or unexpected runtime exception'
    );
  });

  it('ensures user reset/reload paths are available on the recovery panels', () => {
    window.__THROW_CHILD_EXCEPTION__ = true;

    render(
      <LocalizedErrorBoundary>
        <ReturnToTop />
      </LocalizedErrorBoundary>
    );

    const resetButton = screen.getByText('Reset/Reload Path');
    expect(resetButton).toBeInTheDocument();

    // Resolve the internal environment issue so recovery can succeed
    window.__THROW_CHILD_EXCEPTION__ = false;

    // Interact with the user reset/reload path
    fireEvent.click(resetButton);

    // The UI should recover completely back to normal
    expect(screen.queryByTestId('recovery-ui')).not.toBeInTheDocument();

    // The ReturnToTop component renders successfully, proving hydration & execution stability
    expect(screen.getByLabelText('Back to top')).toBeInTheDocument();
  });
});
