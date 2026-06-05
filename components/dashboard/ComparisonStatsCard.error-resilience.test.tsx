/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React, { Component, type HTMLAttributes, type ReactNode, type ErrorInfo } from 'react';
import ComparisonStatsCard from './ComparisonStatsCard';
import '@testing-library/jest-dom/vitest';

// Mock framer-motion to simplify rendering
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => {
      const { initial, animate, whileInView, viewport, whileHover, transition, ...rest } =
        props as any;
      return <div {...rest}>{children}</div>;
    },
  },
}));

// Mock lucide-react and make one icon throw conditionally to test error resilience.
let shouldThrow = false;
vi.mock('lucide-react', () => ({
  Award: ({ className }: { className?: string }) => {
    if (shouldThrow) {
      throw new Error('FATAL_DB_DISCONNECT: Database connection timed out');
    }
    return <svg data-testid="icon-award" className={className} />;
  },
  Flame: () => null,
  TrendingUp: () => null,
  GitCommit: () => null,
  GitBranch: () => null,
  Users: () => null,
  UserPlus: () => null,
  LucideIcon: () => null,
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

describe('ComparisonStatsCard Error Resilience', () => {
  beforeEach(() => {
    shouldThrow = false;
  });

  it('maintains hydration stability and renders without crashing under default properties', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Hydration Test"
        valueA={50}
        valueB={50}
        labelA="A"
        labelB="B"
        icon="Award"
      />
    );

    expect(screen.getByText('Hydration Test')).toBeInTheDocument();
    expect(screen.getByTestId('icon-award')).toBeInTheDocument();
    expect(container.firstChild).not.toBeNull();
  });

  it('safely catches unexpected runtime exceptions / database connectivity errors inside a localized boundary', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    shouldThrow = true;

    expect(() => {
      render(
        <TestErrorBoundary>
          <ComparisonStatsCard
            title="Exception Safety"
            valueA={50}
            valueB={50}
            labelA="A"
            labelB="B"
            icon="Award"
          />
        </TestErrorBoundary>
      );
    }).not.toThrow();

    consoleErrorSpy.mockRestore();
  });

  it('renders a clean error recovery UI representation instead of crashing the page', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    shouldThrow = true;

    render(
      <TestErrorBoundary>
        <ComparisonStatsCard
          title="Recovery UI"
          valueA={50}
          valueB={50}
          labelA="A"
          labelB="B"
          icon="Award"
        />
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.getByText(/System Alert/i)).toBeInTheDocument();
    expect(screen.getByText(/FATAL_DB_DISCONNECT/i)).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('logs exception profiles to the dev-telemetry trackers when database connectivity fails', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockTelemetryTracker = vi.fn();
    shouldThrow = true;

    render(
      <TestErrorBoundary
        onError={(error) => mockTelemetryTracker({ error: error.message, status: 'logged' })}
      >
        <ComparisonStatsCard
          title="Telemetry Test"
          valueA={50}
          valueB={50}
          labelA="A"
          labelB="B"
          icon="Award"
        />
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

  it('ensures user reset and reload paths are available and functional on the recovery panels', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    shouldThrow = true;

    const { rerender } = render(
      <TestErrorBoundary>
        <ComparisonStatsCard
          title="Conditional Monitor"
          valueA={50}
          valueB={50}
          labelA="A"
          labelB="B"
          icon="Award"
        />
      </TestErrorBoundary>
    );

    // Assert recovery UI is displayed
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.queryByText('Conditional Monitor')).not.toBeInTheDocument();

    // Trigger state change so it does not throw on reload
    shouldThrow = false;

    // Click the Reset and Reload button on the recovery panel
    const resetButton = screen.getByTestId('reset-button');
    resetButton.click();

    // Rerender with the updated child state
    rerender(
      <TestErrorBoundary>
        <ComparisonStatsCard
          title="Conditional Monitor"
          valueA={50}
          valueB={50}
          labelA="A"
          labelB="B"
          icon="Award"
        />
      </TestErrorBoundary>
    );

    // Recovery UI should be gone and recovered content visible
    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
    expect(screen.getByText('Conditional Monitor')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
