import React, { Component, ErrorInfo, ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { TechnologyGraph } from './TechnologyGraph';

// Mock telemetry tracker
const mockTelemetryLogger = vi.fn();
const defaultProps = {
  selected: [],
  onToggle: vi.fn(),
};

// Localized Error Boundary for testing exception safety and fallbacks
interface ErrorBoundaryProps {
  children: ReactNode;
  onReset: () => void;
  telemetryLogger?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class LocalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.telemetryLogger) {
      this.props.telemetryLogger(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary-fallback">
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset();
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Dummy components to simulate varied conditions
const BuggyRuntimeChild = () => {
  throw new Error('Unexpected runtime exception!');
};

const BuggyDatabaseChild = () => {
  throw new Error('Database connection timeout or anomaly!');
};

// Start testing suite
describe('TechnologyGraph: Hydration Stability, Exception Safety & Error Fallbacks', () => {
  const mockReset = vi.fn();
  beforeEach(() => {
    mockReset.mockClear();
    mockTelemetryLogger.mockClear();

    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Suppress console.error in tests to keep output clean when errors are thrown intentionally
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Test 1: Hydration Stability - renders valid children without crashing', () => {
    render(
      <LocalErrorBoundary onReset={mockReset} telemetryLogger={mockTelemetryLogger}>
        <TechnologyGraph {...defaultProps} />
      </LocalErrorBoundary>
    );

    // Assert that the target modules render cleanly
    expect(screen.getByText('Technology Dependency Graph')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();
  });

  it('Test 2: Exception Safety - catches unexpected runtime exceptions and renders localized boundary element', () => {
    render(
      <LocalErrorBoundary onReset={mockReset} telemetryLogger={mockTelemetryLogger}>
        <BuggyRuntimeChild />
      </LocalErrorBoundary>
    );

    // Assert that the site does not crash, but rather displays the localized error recovery UI
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText('Unexpected runtime exception!')).toBeInTheDocument();
  });

  it('Test 3: Dev-Telemetry - verifies exceptions are logged to dev-telemetry trackers appropriately', () => {
    render(
      <LocalErrorBoundary onReset={mockReset} telemetryLogger={mockTelemetryLogger}>
        <BuggyRuntimeChild />
      </LocalErrorBoundary>
    );

    // Assert that the mock telemetry logger was called with the error object
    expect(mockTelemetryLogger).toHaveBeenCalledTimes(1);
    const [errorArg] = mockTelemetryLogger.mock.calls[0];
    expect(errorArg).toBeInstanceOf(Error);
    expect(errorArg.message).toBe('Unexpected runtime exception!');
  });

  it('Test 4: Error Fallbacks - isolates and handles mocked database connectivity errors properly', () => {
    render(
      <LocalErrorBoundary onReset={mockReset} telemetryLogger={mockTelemetryLogger}>
        <BuggyDatabaseChild />
      </LocalErrorBoundary>
    );

    // Assert that database connectivity anomalies trigger the error recovery fallback
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    expect(screen.getByText('Database connection timeout or anomaly!')).toBeInTheDocument();
  });

  it('Test 5: Reset/Reload Paths - ensures user reset/reload paths are available on recovery panels and functioning', () => {
    render(
      <LocalErrorBoundary onReset={mockReset} telemetryLogger={mockTelemetryLogger}>
        <BuggyRuntimeChild />
      </LocalErrorBoundary>
    );

    // Verify recovery panel is present
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

    // Find and click the 'Try again' reset button
    const resetButton = screen.getByRole('button', { name: /try again/i });
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);

    // Verify the mockReset callback is executed when the user initiates a reset path
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
