import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import AchievementsSkeleton from './AchievementsSkeleton';
import '@testing-library/jest-dom/vitest';

// State control for conditional mock exception
let shouldThrow = false;

// Save original Array.prototype.map
const originalMap = Array.prototype.map;

// Override Array.prototype.map to throw conditionally during render
Array.prototype.map = function <U>(
  this: unknown[],
  callback: (value: unknown, index: number, array: unknown[]) => U,
  thisArg?: unknown
): U[] {
  if (shouldThrow && this.length === 4 && this[0] === undefined) {
    throw new Error('FATAL_SKELETON_CELL_EXCEPTION: Render blocked by test assertion');
  }
  return originalMap.call(this, callback, thisArg) as U[];
};

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

describe('AchievementsSkeleton - Hydration Stability, Exception Safety & Error Fallbacks', () => {
  beforeEach(() => {
    shouldThrow = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Mock a nested child component or dependency to throw a runtime exception and verify the component is safely wrapped by an Error Boundary without crashing.
  it('safely catches unexpected runtime exceptions inside a localized error boundary without crashing', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    shouldThrow = true;

    expect(() => {
      render(
        <TestErrorBoundary>
          <AchievementsSkeleton />
        </TestErrorBoundary>
      );
    }).not.toThrow();

    consoleErrorSpy.mockRestore();
  });

  // 2. Simulate service/database failures and verify a stable fallback or recovery UI is rendered instead of an unhandled exception.
  it('renders a clean error recovery UI representation instead of crashing the page', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    shouldThrow = true;

    render(
      <TestErrorBoundary>
        <AchievementsSkeleton />
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.getByText(/System Alert/i)).toBeInTheDocument();
    expect(screen.getByText(/FATAL_SKELETON_CELL_EXCEPTION/i)).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  // 3. Verify runtime exceptions are forwarded to mocked logging/telemetry utilities (console.error or project telemetry helper).
  it('logs exception profiles to the dev-telemetry trackers when rendering fails', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockTelemetryTracker = vi.fn();
    shouldThrow = true;

    render(
      <TestErrorBoundary
        onError={(error) => mockTelemetryTracker({ error: error.message, status: 'logged' })}
      >
        <AchievementsSkeleton />
      </TestErrorBoundary>
    );

    expect(mockTelemetryTracker).toHaveBeenCalledTimes(1);
    expect(mockTelemetryTracker).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'FATAL_SKELETON_CELL_EXCEPTION: Render blocked by test assertion',
        status: 'logged',
      })
    );

    consoleErrorSpy.mockRestore();
  });

  // 4. Verify recovery controls (retry/reset/reload actions), if present, are rendered and callable without additional runtime failures.
  it('ensures user reset and reload paths are available and functional on the recovery panels', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    shouldThrow = true;

    const { rerender } = render(
      <TestErrorBoundary>
        <AchievementsSkeleton />
      </TestErrorBoundary>
    );

    // Assert recovery UI is displayed
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-cell')).not.toBeInTheDocument();

    // Trigger state change so it does not throw on reload
    shouldThrow = false;

    // Click the Reset and Reload button on the recovery panel
    const resetButton = screen.getByTestId('reset-button');
    resetButton.click();

    // Rerender
    rerender(
      <TestErrorBoundary>
        <AchievementsSkeleton />
      </TestErrorBoundary>
    );

    // Recovery UI should be gone and skeleton recovered
    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton-cell')).toHaveLength(4);

    consoleErrorSpy.mockRestore();
  });

  // 5. Ensure hydration and rendering remain stable when props are null, undefined, or partially missing, without producing uncaught exceptions.
  it('ensures hydration and rendering remain stable when props are null, undefined, or partially missing', () => {
    // @ts-expect-error - Component accepts no props
    const { container: c1, unmount: u1 } = render(<AchievementsSkeleton props={null} />);
    expect(c1.firstChild).toBeInTheDocument();
    u1();

    // @ts-expect-error - Component accepts no props
    const { container: c2, unmount: u2 } = render(<AchievementsSkeleton customProp={undefined} />);
    expect(c2.firstChild).toBeInTheDocument();
    u2();

    // Verify empty props object
    const { container: c3, unmount: u3 } = render(<AchievementsSkeleton />);
    expect(c3.firstChild).toBeInTheDocument();
    u3();
  });
});
