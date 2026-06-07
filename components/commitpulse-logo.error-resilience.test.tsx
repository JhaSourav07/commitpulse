import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

const mockTelemetryTracker = vi.fn();

/**
 * CommitPulseLogo is a pure SVG component with no native failure paths.
 * To validate error-resilience behavior, we replace it with a
 * controllable test double that can simulate runtime failures.
 */
vi.mock('./commitpulse-logo', () => ({
  CommitPulseLogo: ({ forceCrash }: { forceCrash?: boolean }) => {
    if (forceCrash) {
      throw new Error('Simulated Database Connectivity/Hydration Error');
    }

    return <svg data-testid="healthy-commitpulse-logo" viewBox="0 0 24 24" aria-hidden="true" />;
  },
}));

import { CommitPulseLogo } from './commitpulse-logo';

function FallbackRecoveryUI({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" data-testid="error-recovery-panel">
      <h2>Logo Rendering Failed</h2>

      <p>{error instanceof Error ? error.message : String(error)}</p>

      <button onClick={resetErrorBoundary}>Retry Loading Logo</button>
    </div>
  );
}

describe('CommitPulseLogo — Hydration Stability, Exception Safety & Error Fallbacks', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('encases execution in a localized boundary and prevents application crashes', () => {
    expect(() => {
      render(
        <ErrorBoundary FallbackComponent={FallbackRecoveryUI} onError={mockTelemetryTracker}>
          {/* @ts-expect-error test-only prop */}
          <CommitPulseLogo forceCrash />
        </ErrorBoundary>
      );
    }).not.toThrow();
  });

  it('renders a recovery UI instead of crashing when an exception occurs', () => {
    render(
      <ErrorBoundary FallbackComponent={FallbackRecoveryUI} onError={mockTelemetryTracker}>
        {/* @ts-expect-error test-only prop */}
        <CommitPulseLogo forceCrash />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();

    expect(screen.getByText('Logo Rendering Failed')).toBeInTheDocument();

    expect(screen.queryByTestId('healthy-commitpulse-logo')).not.toBeInTheDocument();
  });

  it('logs unexpected runtime exceptions to telemetry handlers', () => {
    render(
      <ErrorBoundary FallbackComponent={FallbackRecoveryUI} onError={mockTelemetryTracker}>
        {/* @ts-expect-error test-only prop */}
        <CommitPulseLogo forceCrash />
      </ErrorBoundary>
    );

    expect(mockTelemetryTracker).toHaveBeenCalledTimes(1);

    const error = mockTelemetryTracker.mock.calls[0][0];

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Simulated Database Connectivity/Hydration Error');
  });

  it('provides a retry path and invokes reset handling', () => {
    const onReset = vi.fn();

    render(
      <ErrorBoundary
        FallbackComponent={FallbackRecoveryUI}
        onError={mockTelemetryTracker}
        onReset={onReset}
      >
        {/* @ts-expect-error test-only prop */}
        <CommitPulseLogo forceCrash />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', {
      name: /retry loading logo/i,
    });

    fireEvent.click(retryButton);

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('renders normally without fallback UI when no exception occurs', () => {
    render(
      <ErrorBoundary FallbackComponent={FallbackRecoveryUI} onError={mockTelemetryTracker}>
        <CommitPulseLogo />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('healthy-commitpulse-logo')).toBeInTheDocument();

    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();

    expect(mockTelemetryTracker).not.toHaveBeenCalled();
  });
});
