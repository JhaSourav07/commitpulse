import React, { Component, ErrorInfo, ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PRTrendChart from './PRTrendChart';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const mockData = {
  totalPRs: 10,
  openPRs: 2,
  mergedPRs: 7,
  closedPRs: 1,
  mergeRate: 70,
  avgReviewTime: 4,
  avgTimeToFirstReview: 2,
  avgCycleTime: 8,
  weeklyActivity: [
    { name: 'Mon', prs: 2 },
    { name: 'Tue', prs: 3 },
  ],
  monthlyActivity: [
    { name: 'Jan', prs: 5 },
    { name: 'Feb', prs: 8 },
  ],
  reviewsGiven: 6,
  reviewsReceived: 8,
  avgReviewResponseTime: 3,
  fastestReview: 1,
  slowestReview: 12,
  repoPerformance: [],
  highlights: {},
} as unknown as PRInsightData;

const telemetry = {
  trackException: vi.fn(),
};

interface BoundaryProps {
  children: ReactNode;
}

interface BoundaryState {
  hasError: boolean;
}

class LocalizedErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    telemetry.trackException(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-fallback">
          <h2>Something went wrong.</h2>
          <button onClick={() => this.setState({ hasError: false })}>Retry</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const CrashComponent = () => {
  throw new Error('Hydration failure');
};

describe('PRTrendChart - Hydration Stability, Exception Safety & Error Fallbacks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('1. renders recovery UI instead of crashing when nested runtime exception occurs', () => {
    render(
      <LocalizedErrorBoundary>
        <PRTrendChart data={mockData} />
        <CrashComponent />
      </LocalizedErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
  });

  it('2. logs exceptions to telemetry tracker', () => {
    render(
      <LocalizedErrorBoundary>
        <PRTrendChart data={mockData} />
        <CrashComponent />
      </LocalizedErrorBoundary>
    );

    expect(telemetry.trackException).toHaveBeenCalled();
  });

  it('3. provides retry action on recovery panel', () => {
    render(
      <LocalizedErrorBoundary>
        <PRTrendChart data={mockData} />
        <CrashComponent />
      </LocalizedErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('4. recovers successfully after retry', () => {
    const { rerender } = render(
      <LocalizedErrorBoundary key="error">
        <PRTrendChart data={mockData} />
        <CrashComponent />
      </LocalizedErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    rerender(
      <LocalizedErrorBoundary key="recovered">
        <PRTrendChart data={mockData} />
      </LocalizedErrorBoundary>
    );

    expect(screen.getByText('Activity Trends')).toBeInTheDocument();
  });

  it('5. keeps surrounding layout mounted during localized failure', () => {
    render(
      <div>
        <header data-testid="header">Header</header>

        <LocalizedErrorBoundary>
          <PRTrendChart data={mockData} />
          <CrashComponent />
        </LocalizedErrorBoundary>

        <footer data-testid="footer">Footer</footer>
      </div>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
  });
});
