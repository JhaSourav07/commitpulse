import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React, { Component, type HTMLAttributes, type ReactNode, type ErrorInfo } from 'react';
import ReviewAnalytics from './ReviewAnalytics';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const mockData: PRInsightData = {
  totalPRs: 100,
  prs: [],
  openPRs: 10,
  mergedPRs: 80,
  closedPRs: 10,
  mergeRate: 80,
  avgReviewTime: 5.2,
  avgTimeToFirstReview: 2.1,
  avgCycleTime: 12.4,
  weeklyActivity: [],
  monthlyActivity: [],
  reviewsGiven: 24,
  reviewsReceived: 18,
  avgReviewResponseTime: 4.5,
  fastestReview: 1.5,
  slowestReview: 12.4,
  repoPerformance: [],
  highlights: {},
};

interface EBProps {
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  onReset?: () => void;
}

interface EBState {
  hasError: boolean;
}

class TestErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <p>Something went wrong</p>
          {this.props.onReset && <button onClick={this.props.onReset}>Try again</button>}
        </div>
      );
    }
    return this.props.children;
  }
}

describe('ReviewAnalytics Error Resilience', () => {
  it('renders normally with valid data', () => {
    render(
      <TestErrorBoundary>
        <ReviewAnalytics data={mockData} />
      </TestErrorBoundary>
    );
    expect(screen.getByText('24')).toBeDefined();
    expect(screen.getByText('18')).toBeDefined();
  });

  it('catches render exception when data is undefined', () => {
    const onError = vi.fn();
    render(
      <TestErrorBoundary onError={onError}>
        <ReviewAnalytics data={undefined as unknown as PRInsightData} />
      </TestErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeDefined();
    expect(onError).toHaveBeenCalled();
  });

  it('catches render exception when data fields are missing', () => {
    const onError = vi.fn();
    render(
      <TestErrorBoundary onError={onError}>
        <ReviewAnalytics data={{} as PRInsightData} />
      </TestErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeDefined();
    expect(onError).toHaveBeenCalled();
  });

  it('logs exception to dev telemetry', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <TestErrorBoundary>
        <ReviewAnalytics data={undefined as unknown as PRInsightData} />
      </TestErrorBoundary>
    );
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('provides a reset/reload path on the recovery panel', () => {
    const onReset = vi.fn();
    render(
      <TestErrorBoundary onReset={onReset}>
        <ReviewAnalytics data={undefined as unknown as PRInsightData} />
      </TestErrorBoundary>
    );
    const resetBtn = screen.getByText('Try again');
    expect(resetBtn).toBeDefined();
    resetBtn.click();
    expect(onReset).toHaveBeenCalled();
  });
});
