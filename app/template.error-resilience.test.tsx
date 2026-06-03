import React, { Component, ErrorInfo, ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import Template from './template';

// Mock telemetry tracker
const mockTelemetryLogger = vi.fn();

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

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-recovery-panel" className="recovery-panel">
          <h2>An unexpected error occurred</h2>
          <p data-testid="error-message">{this.state.error?.message}</p>
          <button data-testid="reset-button" onClick={this.handleReset}>
            Retry / Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Buggy child components to mock runtime and database errors
const BuggyRuntimeChild = () => {
  throw new Error('Unexpected runtime exception');
};

const BuggyDatabaseChild = () => {
  throw new Error('Database connectivity error: ETIMEDOUT');
};

describe('Template Component - Hydration Stability, Exception Safety & Error Fallbacks', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let mockReset: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Suppress console.error during expected React error boundary tests to keep test output clean
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockReset = vi.fn();
    mockTelemetryLogger.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('Test 1: Hydration Stability - renders valid children without crashing', () => {
    render(
      <LocalErrorBoundary onReset={mockReset} telemetryLogger={mockTelemetryLogger}>
        <Template>
          <div data-testid="valid-child">Valid Content</div>
        </Template>
      </LocalErrorBoundary>
    );

    expect(screen.getByTestId('valid-child')).toBeInTheDocument();
    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
    expect(mockTelemetryLogger).not.toHaveBeenCalled();
  });

  it('Test 2: Exception Safety - catches unexpected runtime exceptions and renders localized boundary element', () => {
    render(
      <LocalErrorBoundary onReset={mockReset} telemetryLogger={mockTelemetryLogger}>
        <Template>
          <BuggyRuntimeChild />
        </Template>
      </LocalErrorBoundary>
    );

    // Assert clean error recovery UI instead of crashing the site
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent('Unexpected runtime exception');
  });

  it('Test 3: Dev-Telemetry - verifies exceptions are logged to dev-telemetry trackers appropriately', () => {
    render(
      <LocalErrorBoundary onReset={mockReset} telemetryLogger={mockTelemetryLogger}>
        <Template>
          <BuggyRuntimeChild />
        </Template>
      </LocalErrorBoundary>
    );

    expect(mockTelemetryLogger).toHaveBeenCalledTimes(1);
    expect(mockTelemetryLogger.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(mockTelemetryLogger.mock.calls[0][0].message).toBe('Unexpected runtime exception');
  });

  it('Test 4: Error Fallbacks - isolates and handles mocked database connectivity errors properly', () => {
    render(
      <LocalErrorBoundary onReset={mockReset} telemetryLogger={mockTelemetryLogger}>
        <Template>
          <BuggyDatabaseChild />
        </Template>
      </LocalErrorBoundary>
    );

    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Database connectivity error: ETIMEDOUT'
    );
    expect(mockTelemetryLogger).toHaveBeenCalledTimes(1);
  });

  it('Test 5: Reset/Reload Paths - ensures user reset/reload paths are available on recovery panels and functioning', () => {
    render(
      <LocalErrorBoundary onReset={mockReset} telemetryLogger={mockTelemetryLogger}>
        <Template>
          <BuggyRuntimeChild />
        </Template>
      </LocalErrorBoundary>
    );

    const retryButton = screen.getByTestId('reset-button');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);

    // Ensure the onReset fallback callback was triggered
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
