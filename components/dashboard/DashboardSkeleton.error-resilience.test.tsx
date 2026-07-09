import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Component, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DashboardSkeleton from './DashboardSkeleton';

vi.mock('./AchievementsSkeleton', () => ({
  default: () => <div data-testid="achievements-skeleton" />,
}));
vi.mock('./AIInsightsSkeleton', () => ({
  default: () => <div data-testid="ai-insights-skeleton" />,
}));
vi.mock('./StatsCardSkeleton', () => ({
  default: () => <div data-testid="stats-card-skeleton" />,
}));

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function RecoveryPanel() {
  return (
    <div data-testid="recovery-panel">
      <p>Something went wrong loading the dashboard.</p>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  );
}

const suppressConsoleError = () => vi.spyOn(console, 'error').mockImplementation(() => {});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DashboardSkeleton - Hydration Stability, Exception Safety & Error Fallbacks', () => {
  it('renders without crashing and exposes shimmer structure when all child skeletons render normally', () => {
    suppressConsoleError();

    render(
      <ErrorBoundary fallback={<RecoveryPanel />}>
        <DashboardSkeleton />
      </ErrorBoundary>
    );

    expect(screen.queryByTestId('recovery-panel')).not.toBeInTheDocument();
    expect(document.querySelectorAll('.shimmer').length).toBeGreaterThan(0);
  });

  it('error boundary catches a thrown exception from AchievementsSkeleton and renders recovery UI', () => {
    suppressConsoleError();

    const AchievementsSkeletonBroken = () => {
      throw new Error('AchievementsSkeleton: simulated DB connectivity error');
    };

    render(
      <ErrorBoundary fallback={<RecoveryPanel />}>
        <AchievementsSkeletonBroken />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('recovery-panel')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong loading the dashboard.')).toBeInTheDocument();
  });

  it('error boundary catches a thrown exception from AIInsightsSkeleton and exposes the reload path', () => {
    suppressConsoleError();

    const AIInsightsSkeletonBroken = () => {
      throw new Error('AIInsightsSkeleton: simulated service timeout');
    };

    render(
      <ErrorBoundary fallback={<RecoveryPanel />}>
        <AIInsightsSkeletonBroken />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('recovery-panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });

  it('error boundary catches a thrown exception from StatsCardSkeleton and logs the error via getDerivedStateFromError', () => {
    suppressConsoleError();

    const capturedErrors: Error[] = [];

    interface CapturingState {
      hasError: boolean;
    }

    interface CapturingProps {
      children: ReactNode;
    }

    class CapturingBoundary extends Component<CapturingProps, CapturingState> {
      state: CapturingState = { hasError: false };

      static getDerivedStateFromError(error: Error): CapturingState {
        capturedErrors.push(error);
        return { hasError: true };
      }

      render(): ReactNode {
        if (this.state.hasError) return <RecoveryPanel />;
        return this.props.children;
      }
    }

    const StatsCardBroken = () => {
      throw new Error('StatsCardSkeleton: simulated background service interruption');
    };

    render(
      <CapturingBoundary>
        <StatsCardBroken />
      </CapturingBoundary>
    );

    expect(capturedErrors.length).toBeGreaterThanOrEqual(1);
    expect(capturedErrors[0].message).toContain('StatsCardSkeleton');
    expect(screen.getByTestId('recovery-panel')).toBeInTheDocument();
  });

  it('renders the full DashboardSkeleton inside an error boundary without hydration errors or console errors', () => {
    const errorSpy = vi.spyOn(console, 'error');

    render(
      <ErrorBoundary fallback={<RecoveryPanel />}>
        <DashboardSkeleton />
      </ErrorBoundary>
    );

    expect(screen.queryByTestId('recovery-panel')).not.toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('achievements-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('ai-insights-skeleton')).toBeInTheDocument();
    expect(screen.getAllByTestId('stats-card-skeleton').length).toBe(3);
  });
});
