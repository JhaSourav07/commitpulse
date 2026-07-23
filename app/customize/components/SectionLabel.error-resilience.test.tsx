import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { SectionLabel } from './SectionLabel';

// --- MOCK TELEMETRY TRACKER ---
const mockTelemetryLogger = vi.fn();

// --- TEST ERROR BOUNDARY ---
// Simulates a standard Next.js error.tsx boundary or localized component boundary
class TestErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Simulate logging to a dev-telemetry tracker (e.g., Sentry, Datadog)
    mockTelemetryLogger(error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-recovery-panel" className="p-4 bg-red-50 text-red-900 rounded-md">
          <p>We encountered an unexpected issue loading this section.</p>
          <button
            data-testid="reset-button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset?.();
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

// --- FAULTY CHILD MOCK ---
// Artificially triggers a crash to test resilience
const FaultyChild = ({ shouldCrash }: { shouldCrash: boolean }) => {
  if (shouldCrash) {
    throw new Error('Simulated database connectivity exception');
  }
  return <div data-testid="healthy-child">Healthy Content</div>;
};

describe('SectionLabel Hydration Stability & Error Fallbacks', () => {
  // Suppress React's intentional console.error output during error boundary tests to keep CI logs clean
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockTelemetryLogger.mockClear(); // Explicitly clear the mock between tests
    console.error = vi.fn();
  });

  afterEach(() => {
    cleanup();
    console.error = originalConsoleError;
  });

  it('1. mocks nested child properties to throw unexpected runtime exceptions or database connectivity errors', () => {
    // Assert that attempting to render the faulty component without a boundary throws as expected
    expect(() => render(<FaultyChild shouldCrash={true} />)).toThrow(
      'Simulated database connectivity exception'
    );
  });

  it('2. encases execution calls in localized boundary elements', () => {
    // Ensure the boundary safely wraps the component without interfering with healthy rendering
    render(
      <TestErrorBoundary>
        <SectionLabel>
          <div>Preferences</div>
          <FaultyChild shouldCrash={false} />
        </SectionLabel>
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('healthy-child')).toBeDefined();
    expect(screen.queryByTestId('error-recovery-panel')).toBeNull();
  });

  it('3. asserts that target modules render a clean error recovery UI instead of crashing the site', () => {
    render(
      <TestErrorBoundary>
        <SectionLabel>
          <div>Preferences</div>
          <FaultyChild shouldCrash={true} />
        </SectionLabel>
      </TestErrorBoundary>
    );

    // The healthy child should NOT be in the document
    expect(screen.queryByTestId('healthy-child')).toBeNull();
    // The recovery panel should be rendered instead of a total crash
    expect(screen.getByTestId('error-recovery-panel')).toBeDefined();
  });

  it('4. verifies exceptions are logged to dev-telemetry trackers appropriately', () => {
    render(
      <TestErrorBoundary>
        <SectionLabel>
          <div>Preferences</div>
          <FaultyChild shouldCrash={true} />
        </SectionLabel>
      </TestErrorBoundary>
    );

    // Check that the componentDidCatch block successfully fired our mock telemetry tracker.
    // Using toHaveBeenCalled() instead of toHaveBeenCalledTimes(1) protects against React 18 Strict Mode double-invocations.
    expect(mockTelemetryLogger).toHaveBeenCalled();
    expect(mockTelemetryLogger).toHaveBeenCalledWith('Simulated database connectivity exception');
  });

  it('5. ensures user reset/reload paths are available on the recovery panels', () => {
    const onResetMock = vi.fn();

    render(
      <TestErrorBoundary onReset={onResetMock}>
        <SectionLabel>
          <div>Preferences</div>
          <FaultyChild shouldCrash={true} />
        </SectionLabel>
      </TestErrorBoundary>
    );

    const resetButton = screen.getByTestId('reset-button');
    expect(resetButton).toBeDefined();

    // Simulate user clicking "Try again"
    fireEvent.click(resetButton);

    expect(onResetMock).toHaveBeenCalledTimes(1);
  });
});
