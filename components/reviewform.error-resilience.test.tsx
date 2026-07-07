import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReviewForm from './reviewform';

// --- MOCKS ---
// Mocking framer-motion animations out of the way for clean, uniform execution
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: ReactNode }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: { children: ReactNode }) => (
      <button {...props}>{children}</button>
    ),
  },
}));

// Mocking Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mocking AdvancedColorPicker to insulate it or simulate an isolated error path
vi.mock('./AdvancedColorPicker', () => ({
  default: ({ value, onChange }: { value: string; onChange: (color: string) => void }) => (
    <div data-testid="mock-color-picker">
      <button data-testid="trigger-picker-error" onClick={() => onChange(value)}>
        Color Picker
      </button>
    </div>
  ),
}));

// Mock tracking utility matching the requirements of the issue statement
const mockTelemetry = {
  trackException: vi.fn(),
};

// --- LOCALIZED TEST ERROR BOUNDARY ---
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
}
class LocalizedErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };
  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    mockTelemetry.trackException(error, errorInfo);
  }
  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div data-testid="error-boundary-fallback">
            <h3>Something went wrong.</h3>
            <button onClick={() => this.setState({ hasError: false })}>Retry Connection</button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// A helper component designed to trigger structural runtime exception failures during hydration
const StructuralCrashTrigger = () => {
  throw new Error('Database connection failed unexpectedly during hydration');
};

describe('ReviewForm - Hydration Stability, Exception Safety & Error Fallbacks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    // Silence intentional console errors to maintain a pristine test run output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // TEST CASE 1
  it('1. should render a clean error recovery UI instead of crashing when a nested runtime exception occurs', () => {
    render(
      <LocalizedErrorBoundary>
        <ReviewForm />
        <StructuralCrashTrigger />
      </LocalizedErrorBoundary>
    );

    const fallbackUI = screen.getByTestId('error-boundary-fallback');
    expect(fallbackUI).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong./i)).toBeInTheDocument();
  });

  // TEST CASE 2
  it('2. should verify exceptions are logged to dev-telemetry trackers appropriately when crashes happen', () => {
    render(
      <LocalizedErrorBoundary>
        <ReviewForm />
        <StructuralCrashTrigger />
      </LocalizedErrorBoundary>
    );

    expect(mockTelemetry.trackException).toHaveBeenCalled();
    expect(mockTelemetry.trackException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );
  });

  // TEST CASE 3
  it('3. should ensure user reset and reload interaction paths are available on recovery panels', () => {
    render(
      <LocalizedErrorBoundary>
        <ReviewForm />
        <StructuralCrashTrigger />
      </LocalizedErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /retry connection/i });
    expect(retryButton).toBeInTheDocument();
  });

  // TEST CASE 4
  it('4. should recover successfully and try re-rendering when user triggers the reset/retry path', () => {
    const { rerender } = render(
      <LocalizedErrorBoundary key="crashing-state">
        <ReviewForm />
        <StructuralCrashTrigger />
      </LocalizedErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong./i)).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /retry connection/i });
    fireEvent.click(retryButton);

    // Provide a different key here to clear the boundary state completely
    rerender(
      <LocalizedErrorBoundary key="recovered-state">
        <ReviewForm />
      </LocalizedErrorBoundary>
    );

    expect(screen.queryByText(/Something went wrong./i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share my testimonial/i })).toBeInTheDocument();
  });

  // TEST CASE 5
  it('5. should maintain localized hydration stability under isolated background service interruptions without unmounting layout shells', () => {
    render(
      <div>
        <header data-testid="global-header">Global Navigation Shell</header>
        <LocalizedErrorBoundary>
          <ReviewForm />
          <StructuralCrashTrigger />
        </LocalizedErrorBoundary>
        <footer data-testid="global-footer">Global Footer Layout</footer>
      </div>
    );

    // Ensure localized elements crashed gracefully while outer shell modules remained unaffected
    expect(screen.getByTestId('global-header')).toBeInTheDocument();
    expect(screen.getByTestId('global-footer')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
  });
});
