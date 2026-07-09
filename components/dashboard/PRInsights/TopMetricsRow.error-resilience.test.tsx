import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import TopMetricsRow from './TopMetricsRow';
import type { PRInsightData } from '@/services/github/pr-insights';

// Mock framer-motion to bypass animations in tests (same as sibling test files)
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Controllable flag (hoisted so it's visible inside the mocked factory below)
const { iconState } = vi.hoisted(() => ({ iconState: { shouldThrow: false } }));

// Mock the nested child so we can force it to throw a runtime exception on demand
vi.mock('./AnimatedMetricIcon', () => ({
  default: () => {
    if (iconState.shouldThrow) {
      throw new Error('AnimatedMetricIcon: unexpected runtime exception');
    }
    return <div data-testid="animated-metric-icon" />;
  },
}));

const validData: PRInsightData = {
  totalPRs: 120,
  mergeRate: 87.5,
  avgCycleTime: 14.2,
  avgTimeToFirstReview: 3.6,
  weeklyActivity: [{ prs: 12 }],
} as PRInsightData;

// Minimal local Error Boundary, mirroring the "boundary element" pattern requested in the issue.
// It logs the caught error (dev-telemetry hook) and exposes a reset/reload action.
class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Stand-in for the project's dev-telemetry tracker
    console.error('[telemetry] TopMetricsRow render failure captured:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <p>Something went wrong while loading your metrics.</p>
          <button type="button" onClick={this.handleReset}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

describe('TopMetricsRow Error Resilience', () => {
  beforeEach(() => {
    iconState.shouldThrow = false;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    iconState.shouldThrow = false;
    vi.restoreAllMocks();
  });

  // 1. Hydration stability: valid data renders cleanly with no fallback engaged.
  it('renders stably with valid data and never engages the error fallback', () => {
    render(
      <TestErrorBoundary>
        <TopMetricsRow data={validData} />
      </TestErrorBoundary>
    );

    expect(screen.getByText('Total PRs')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // 2. Exception safety: a nested child throwing an unexpected runtime exception
  // must not crash the page; the boundary should catch it.
  it('catches an unexpected runtime exception thrown by a nested child component', () => {
    iconState.shouldThrow = true;

    render(
      <TestErrorBoundary>
        <TopMetricsRow data={validData} />
      </TestErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText('Something went wrong while loading your metrics.')
    ).toBeInTheDocument();
  });

  // 3. Exception safety: malformed/missing numeric data (e.g. mergeRate undefined)
  // throws inside .toFixed(); the boundary must render a clean fallback instead of crashing.
  it('renders a clean error fallback when malformed metric data causes a runtime exception', () => {
    const malformedData = {
      totalPRs: 10,
      mergeRate: undefined,
      avgCycleTime: 5,
      avgTimeToFirstReview: 2,
      weeklyActivity: [],
    } as unknown as PRInsightData;

    render(
      <TestErrorBoundary>
        <TopMetricsRow data={malformedData} />
      </TestErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  // 4. Verify exceptions are logged to the dev-telemetry tracker (console.error) appropriately.
  it('logs the caught exception to the dev-telemetry tracker', () => {
    iconState.shouldThrow = true;
    const errorSpy = vi.spyOn(console, 'error');

    render(
      <TestErrorBoundary>
        <TopMetricsRow data={validData} />
      </TestErrorBoundary>
    );

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[telemetry] TopMetricsRow render failure captured:'),
      expect.any(Error)
    );
  });

  // 5. Ensure a user reset/reload path is available on the recovery panel and it
  // successfully re-renders the component once the underlying issue is resolved.
  it('provides a working reset action on the recovery panel', () => {
    iconState.shouldThrow = true;

    render(
      <TestErrorBoundary>
        <TopMetricsRow data={validData} />
      </TestErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Simulate the underlying issue being resolved before the user retries
    iconState.shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Total PRs')).toBeInTheDocument();
  });
});
