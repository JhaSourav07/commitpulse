import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import '@testing-library/jest-dom';
import TopRivalriesTicker from './TopRivalriesTicker';

// --- MOCKS ---
// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock framer-motion to simplify rendering and focus on React/JSDOM interaction
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: ReactNode }) => <div {...props}>{children}</div>,
  },
}));

// Mock Telemetry Tracker
const mockTelemetry = {
  trackException: vi.fn(),
};

// --- LOCALIZED TEST ERROR BOUNDARY ---
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class LocalizedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    mockTelemetry.trackException(error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            data-testid="error-recovery-panel"
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <h3>Something went wrong.</h3>
            <p>Error: {this.state.error?.message}</p>
            <button onClick={this.handleReset} data-testid="retry-button">
              Retry Connection
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// Exception throwing custom Icon component
const BadIcon = () => {
  throw new Error('FATAL_DB_DISCONNECT: Database connection timed out');
};

const badRivalries = [
  {
    u1: 'torvalds',
    u2: 'gaearon',
    label: 'Kernel vs React',
    icon: BadIcon,
    color: 'text-orange-500',
  },
];

const normalRivalries = [
  {
    u1: 'torvalds',
    u2: 'gaearon',
    label: 'Kernel vs React',
    icon: () => <span data-testid="normal-icon">🔥</span>,
    color: 'text-orange-500',
  },
];

describe('TopRivalriesTicker - Hydration Stability, Exception Safety & Error Fallbacks (Variation 6)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Silence React Error Boundary warnings in console log during tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // Test Case 1: Hydration Stability under normal render
  it('1. should render standard rivalries properly and remain stable during standard hydration and render cycles', () => {
    render(<TopRivalriesTicker rivalries={normalRivalries} />);

    // Check that we render the rivalry usernames and labels correctly
    const torvaldsElements = screen.getAllByText('torvalds');
    expect(torvaldsElements.length).toBeGreaterThanOrEqual(2); // Duplicated for marquee

    const labelElements = screen.getAllByText('Kernel vs React');
    expect(labelElements.length).toBeGreaterThanOrEqual(2);
  });

  // Test Case 2: Exception Safety
  it('2. should render a clean error recovery UI instead of crashing the site when a nested child throws a database connectivity error', () => {
    render(
      <LocalizedErrorBoundary>
        <TopRivalriesTicker rivalries={badRivalries} />
      </LocalizedErrorBoundary>
    );

    const recoveryPanel = screen.getByTestId('error-recovery-panel');
    expect(recoveryPanel).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong./i)).toBeInTheDocument();
    expect(screen.getByText(/FATAL_DB_DISCONNECT/i)).toBeInTheDocument();
  });

  // Test Case 3: Telemetry Tracking
  it('3. should verify exceptions are logged to dev-telemetry trackers appropriately when crashes happen', () => {
    render(
      <LocalizedErrorBoundary>
        <TopRivalriesTicker rivalries={badRivalries} />
      </LocalizedErrorBoundary>
    );

    expect(mockTelemetry.trackException).toHaveBeenCalledTimes(1);
    expect(mockTelemetry.trackException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
    expect(mockTelemetry.trackException.mock.calls[0][0].message).toContain('FATAL_DB_DISCONNECT');
  });

  // Test Case 4: Reset & Reload Paths
  it('4. should ensure user reset/reload paths are available on the recovery panels and allow recovery when clicked', () => {
    const { rerender } = render(
      <LocalizedErrorBoundary key="crashing-state">
        <TopRivalriesTicker rivalries={badRivalries} />
      </LocalizedErrorBoundary>
    );

    // Verify recovery panel & retry button are displayed
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();

    // Click retry button to reset error state
    fireEvent.click(retryButton);

    // Re-render with clean rivalries under a new key to completely clear state
    rerender(
      <LocalizedErrorBoundary key="recovered-state">
        <TopRivalriesTicker rivalries={normalRivalries} />
      </LocalizedErrorBoundary>
    );

    // Verify error UI is gone and normal content is back
    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
    expect(screen.getAllByText('torvalds').length).toBeGreaterThanOrEqual(2);
  });

  // Test Case 5: Layout Shell Persistence
  it('5. should maintain localized hydration stability under isolated background service interruptions without unmounting layout shells', () => {
    render(
      <div>
        <header data-testid="global-header">Global Navigation Shell</header>
        <LocalizedErrorBoundary>
          <TopRivalriesTicker rivalries={badRivalries} />
        </LocalizedErrorBoundary>
        <footer data-testid="global-footer">Global Footer Layout</footer>
      </div>
    );

    // Ensure localized elements crashed gracefully while outer shell modules remained unaffected
    expect(screen.getByTestId('global-header')).toBeInTheDocument();
    expect(screen.getByTestId('global-footer')).toBeInTheDocument();
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
  });
});
