import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { NameSection } from './NameSection';

// ----------------------------------------------------------------------
// Mock Error Boundary & Telemetry
// ----------------------------------------------------------------------
const mockTelemetryTracker = vi.fn();

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class TestErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 4. Verify exceptions are logged to dev-telemetry trackers
    mockTelemetryTracker(error.message, errorInfo);
  }

  resetBoundary = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-recovery-ui">
          {this.props.fallback}
          <button data-testid="reset-button" onClick={this.resetBoundary}>
            Retry / Reset
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ----------------------------------------------------------------------
// Faulty Wrapper
// ----------------------------------------------------------------------
function NameSectionFaultyWrapper({ triggerCrash }: { triggerCrash: boolean }) {
  if (triggerCrash) {
    // 1. Mock nested child properties to throw unexpected runtime exceptions
    throw new Error('Simulated connectivity or rendering exception');
  }

  return <NameSection value="Omkar" onChange={() => {}} />;
}

// ----------------------------------------------------------------------
// Test Suite
// ----------------------------------------------------------------------
describe('Hydration Stability, Exception Safety & Error Fallbacks', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress React's intentional error boundary logging in tests to keep the console clean
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('1. Mock nested child properties to throw unexpected runtime exceptions or database connectivity errors', () => {
    // 2. Encase execution calls in localized boundary elements
    render(
      <TestErrorBoundary fallback={<p>Something went wrong!</p>}>
        <NameSectionFaultyWrapper triggerCrash={true} />
      </TestErrorBoundary>
    );

    // Test successfully catches it without unhandled rejection
    expect(mockTelemetryTracker).toHaveBeenCalled();
  });

  it('2. Encase execution calls in localized boundary elements (Healthy Path)', () => {
    render(
      <TestErrorBoundary fallback={<p>Something went wrong!</p>}>
        <NameSectionFaultyWrapper triggerCrash={false} />
      </TestErrorBoundary>
    );

    // Ensure the normal UI renders perfectly when no crash occurs
    expect(screen.getByText('Display Name')).toBeTruthy();
    expect(screen.queryByTestId('error-recovery-ui')).toBeNull();
  });

  it('3. Assert that target modules render a clean error recovery UI instead of crashing the site', () => {
    render(
      <TestErrorBoundary fallback={<p>Clean Error Recovery UI</p>}>
        <NameSectionFaultyWrapper triggerCrash={true} />
      </TestErrorBoundary>
    );

    const recoveryUI = screen.getByTestId('error-recovery-ui');
    expect(recoveryUI).toBeTruthy();
    expect(recoveryUI.textContent).toContain('Clean Error Recovery UI');
  });

  it('4. Verify exceptions are logged to dev-telemetry trackers appropriately', () => {
    render(
      <TestErrorBoundary fallback={<p>Clean Error Recovery UI</p>}>
        <NameSectionFaultyWrapper triggerCrash={true} />
      </TestErrorBoundary>
    );

    // Check that our mock telemetry tracker successfully received the error payload
    expect(mockTelemetryTracker).toHaveBeenCalledTimes(1);
    expect(mockTelemetryTracker).toHaveBeenCalledWith(
      'Simulated connectivity or rendering exception',
      expect.anything()
    );
  });

  it('5. Ensure user reset/reload paths are available on the recovery panels', () => {
    const { rerender } = render(
      <TestErrorBoundary fallback={<p>Clean Error Recovery UI</p>}>
        <NameSectionFaultyWrapper triggerCrash={true} />
      </TestErrorBoundary>
    );

    const resetButton = screen.getByTestId('reset-button');
    expect(resetButton).toBeTruthy();

    // Fix: We must update the component state to a healthy path BEFORE we click reset.
    // Otherwise, clicking reset causes the faulty wrapper to render and crash instantly again!
    rerender(
      <TestErrorBoundary fallback={<p>Clean Error Recovery UI</p>}>
        <NameSectionFaultyWrapper triggerCrash={false} />
      </TestErrorBoundary>
    );

    // Clicking retry simulates resolving the state by the user now that the state is safe
    fireEvent.click(resetButton);

    expect(screen.queryByTestId('error-recovery-ui')).toBeNull();
    expect(screen.getByText('Display Name')).toBeTruthy();
  });
});
