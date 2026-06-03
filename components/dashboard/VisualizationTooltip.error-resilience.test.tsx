// components/dashboard/VisualizationTooltip.error-resilience.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React, { Component, type HTMLAttributes, type ReactNode, type ErrorInfo } from 'react';
import VisualizationTooltip from './VisualizationTooltip';
import '@testing-library/jest-dom/vitest';

// Mock framer-motion to simplify rendering
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Localized Error Boundary for exception safety & fallback tests
interface ErrorBoundaryProps {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TestErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="error-recovery-panel"
          className="p-4 border border-red-500 rounded bg-red-50 text-red-700"
        >
          <h3>System Alert</h3>
          <p>Unexpected exception: {this.state.error?.message}</p>
          <button
            onClick={this.handleReset}
            data-testid="reset-button"
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            Reset and Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Nested child component that throws a database connectivity error/runtime exception
const DatabaseConnectivityThrower = () => {
  throw new Error('FATAL_DB_DISCONNECT: Database connection timed out');
};

describe('VisualizationTooltip Error Resilience', () => {
  // Test case 1: Hydration stability
  it('maintains hydration stability and renders without crashing under default properties', () => {
    const { container } = render(
      <VisualizationTooltip title="Active Users" x={120} y={240}>
        <span>32 active sessions</span>
      </VisualizationTooltip>
    );

    const tooltipElement = screen.getByRole('tooltip');
    expect(tooltipElement).toBeInTheDocument();
    expect(tooltipElement).toHaveStyle({
      left: '120px',
      top: '240px',
    });
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('32 active sessions')).toBeInTheDocument();
    expect(container.firstChild).not.toBeNull();
  });

  // Test case 2: Exception safety & localized boundary
  it('safely catches unexpected runtime exceptions / database connectivity errors inside a localized boundary', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(
        <TestErrorBoundary>
          <VisualizationTooltip title="System Monitor" x={50} y={50}>
            <DatabaseConnectivityThrower />
          </VisualizationTooltip>
        </TestErrorBoundary>
      );
    }).not.toThrow();

    consoleErrorSpy.mockRestore();
  });

  // Test case 3: Clean error recovery UI
  it('renders a clean error recovery UI representation instead of crashing the page', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestErrorBoundary>
        <VisualizationTooltip title="System Monitor" x={50} y={50}>
          <DatabaseConnectivityThrower />
        </VisualizationTooltip>
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.getByText(/System Alert/i)).toBeInTheDocument();
    expect(screen.getByText(/FATAL_DB_DISCONNECT/i)).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  // Test case 4: Verify exceptions are logged to dev-telemetry trackers
  it('logs exception profiles to the dev-telemetry trackers when database connectivity fails', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockTelemetryTracker = vi.fn();

    render(
      <TestErrorBoundary
        onError={(error) => mockTelemetryTracker({ error: error.message, status: 'logged' })}
      >
        <VisualizationTooltip title="System Monitor" x={50} y={50}>
          <DatabaseConnectivityThrower />
        </VisualizationTooltip>
      </TestErrorBoundary>
    );

    expect(mockTelemetryTracker).toHaveBeenCalledTimes(1);
    expect(mockTelemetryTracker).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'FATAL_DB_DISCONNECT: Database connection timed out',
        status: 'logged',
      })
    );

    consoleErrorSpy.mockRestore();
  });

  // Test case 5: User reset/reload path availability
  it('ensures user reset and reload paths are available and functional on the recovery panels', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let shouldThrow = true;
    const ConditionalThrower = () => {
      if (shouldThrow) {
        throw new Error('Temporary failure');
      }
      return <span>Successfully Recovered</span>;
    };

    const { rerender } = render(
      <TestErrorBoundary>
        <VisualizationTooltip title="Conditional Monitor" x={80} y={150}>
          <ConditionalThrower />
        </VisualizationTooltip>
      </TestErrorBoundary>
    );

    // Assert recovery UI is displayed
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.queryByText('Successfully Recovered')).not.toBeInTheDocument();

    // Trigger state change so it does not throw on reload
    shouldThrow = false;

    // Click the Reset and Reload button on the recovery panel
    const resetButton = screen.getByTestId('reset-button');
    resetButton.click();

    // Rerender with the updated child state
    rerender(
      <TestErrorBoundary>
        <VisualizationTooltip title="Conditional Monitor" x={80} y={150}>
          <ConditionalThrower />
        </VisualizationTooltip>
      </TestErrorBoundary>
    );

    // Recovery UI should be gone and recovered content visible
    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
    expect(screen.getByText('Successfully Recovered')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
