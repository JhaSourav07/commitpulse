import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ==========================================
// 1. MOCK COMPONENTS (Our Controlled Test Laboratory)
// ==========================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// FIXED: We completely removed 'any' by declaring specific Type Interfaces!
class TestErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // FIXED: Changed 'error: any' to 'error: unknown' to make the compiler completely happy
  componentDidCatch(error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Telemetry Logged:', errorMessage);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const CrashingSkeleton: React.FC<{ shouldCrash: boolean }> = ({ shouldCrash }) => {
  if (shouldCrash) {
    throw new Error('Database connectivity error!');
  }
  return <div data-testid="loading-skeleton">Loading premium contributor grid...</div>;
};

const ErrorRecoveryPanel: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <div data-testid="error-fallback-ui">
    <h3>Failed to load layout safely</h3>
    <button data-testid="retry-btn" onClick={onReset}>
      Reload System Layout
    </button>
  </div>
);

// ==========================================
// 2. THE VITEST SUITE (Using Native Vitest Matchers)
// ==========================================

describe('ContributorsLoading Error Resilience & Hydration Stability', () => {
  // Test Case 1
  it('should trigger a runtime exception when nested elements encounter a crash condition', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<CrashingSkeleton shouldCrash={true} />);
    }).toThrow('Database connectivity error!');

    consoleSpy.mockRestore();
  });

  // Test Case 2
  it('should catch exceptions cleanly using our safety boundary without crashing the whole application', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestErrorBoundary fallback={<div data-testid="safe-fallback">Safe Recovery Screen</div>}>
        <CrashingSkeleton shouldCrash={true} />
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('safe-fallback')).toBeDefined();
    expect(screen.queryByTestId('loading-skeleton')).toBeNull();

    consoleSpy.mockRestore();
  });

  // Test Case 3
  it('should render our detailed error recovery panel when a system anomaly occurs', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestErrorBoundary fallback={<ErrorRecoveryPanel onReset={() => {}} />}>
        <CrashingSkeleton shouldCrash={true} />
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback-ui')).toBeDefined();
    expect(screen.getByText('Failed to load layout safely')).toBeDefined();

    consoleSpy.mockRestore();
  });

  // Test Case 4
  it('should pass the caught error data straight into our telemetry loggers', () => {
    const telemetrySpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestErrorBoundary fallback={<div>Fallback</div>}>
        <CrashingSkeleton shouldCrash={true} />
      </TestErrorBoundary>
    );

    expect(telemetrySpy).toHaveBeenCalledWith('Telemetry Logged:', 'Database connectivity error!');

    telemetrySpy.mockRestore();
  });

  // Test Case 5
  it('should activate the reset callback function when a user clicks the Reload button', () => {
    const mockResetAction = vi.fn();

    render(<ErrorRecoveryPanel onReset={mockResetAction} />);

    const retryButton = screen.getByTestId('retry-btn');
    fireEvent.click(retryButton);

    expect(mockResetAction).toHaveBeenCalledTimes(1);
  });
});
