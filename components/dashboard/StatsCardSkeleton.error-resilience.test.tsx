import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import StatsCardSkeleton from './StatsCardSkeleton';

type BoundaryProps = {
  children: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  onReset?: () => void;
};
type BoundaryState = { hasError: boolean };

class RecoveryBoundary extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="recovery-panel">
          <StatsCardSkeleton />
          <button data-testid="reset-button" onClick={this.reset}>
            Reset
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ThrowingChild(): React.ReactElement {
  throw new Error('Simulated database connectivity error');
}

// Creates a child whose failure is controlled from the OUTSIDE (via
// stopThrowing), not from within its own render. This keeps it failing
// consistently through React's internal render retries, and only clears
// once the user explicitly resets.
function createControllableThrowingChild() {
  let shouldThrow = true;
  const ControllableChild = (): React.ReactElement => {
    if (shouldThrow) {
      throw new Error('Simulated database connectivity error');
    }
    return <div data-testid="real-content">Stats loaded</div>;
  };
  return {
    ControllableChild,
    stopThrowing: () => {
      shouldThrow = false;
    },
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('StatsCardSkeleton - Error Resilience', () => {
  it('renders a clean recovery UI with the skeleton instead of crashing when a nested child throws a runtime exception', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { getByTestId, container } = render(
      <RecoveryBoundary>
        <ThrowingChild />
      </RecoveryBoundary>
    );

    expect(getByTestId('recovery-panel')).toBeDefined();
    expect(container.querySelectorAll('.shimmer').length).toBe(16);
  });

  it('recovers with the skeleton fallback when a simulated database connectivity error occurs', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    function DbDependentChild(): React.ReactElement {
      throw new Error('DB connection refused: ECONNREFUSED');
    }

    const { getByTestId } = render(
      <RecoveryBoundary>
        <DbDependentChild />
      </RecoveryBoundary>
    );

    expect(getByTestId('recovery-panel')).toBeDefined();
    expect(getByTestId('recovery-panel').querySelectorAll('.shimmer').length).toBe(16);
  });

  it('logs the caught exception to a dev-telemetry tracker while still rendering the skeleton fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const telemetryTracker = vi.fn();

    const { getByTestId } = render(
      <RecoveryBoundary onError={(error) => telemetryTracker(error.message)}>
        <ThrowingChild />
      </RecoveryBoundary>
    );

    expect(telemetryTracker).toHaveBeenCalledTimes(1);
    expect(telemetryTracker).toHaveBeenCalledWith('Simulated database connectivity error');
    expect(getByTestId('recovery-panel')).toBeDefined();
  });

  it('provides a working reset path on the recovery panel that clears the error state once the failure has passed', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { ControllableChild, stopThrowing } = createControllableThrowingChild();

    const { getByTestId, queryByTestId } = render(
      <RecoveryBoundary onReset={stopThrowing}>
        <ControllableChild />
      </RecoveryBoundary>
    );

    expect(getByTestId('recovery-panel')).toBeDefined();

    fireEvent.click(getByTestId('reset-button'));

    expect(queryByTestId('recovery-panel')).toBeNull();
    expect(getByTestId('real-content')).toBeDefined();
  });

  it('remains stable and renders a consistent shimmer structure across repeated mount and unmount cycles', () => {
    for (let i = 0; i < 5; i += 1) {
      const { container, unmount } = render(<StatsCardSkeleton />);
      expect(container.querySelectorAll('.shimmer').length).toBe(16);
      unmount();
    }
  });
});
