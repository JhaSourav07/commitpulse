import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PRTrendChart from './PRTrendChart';

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

const emptyData = {
  totalPRs: 0,
  openPRs: 0,
  mergedPRs: 0,
  closedPRs: 0,
  mergeRate: 0,
  avgReviewTime: 0,
  avgTimeToFirstReview: 0,
  avgCycleTime: 0,

  weeklyActivity: [],
  monthlyActivity: [],

  reviewsGiven: 0,
  reviewsReceived: 0,
  avgReviewResponseTime: 0,
  fastestReview: 0,
  slowestReview: 0,

  repoPerformance: [],
  highlights: {},
} as never;

describe('PRTrendChart Empty/Missing Inputs Verification', () => {
  it('renders successfully with empty activity datasets', () => {
    render(<PRTrendChart data={emptyData} />);

    expect(screen.getByText('Activity Trends')).toBeInTheDocument();
    expect(screen.getByText('Pull requests over time')).toBeInTheDocument();
  });

  it('renders chart container when weekly and monthly data are empty', () => {
    render(<PRTrendChart data={emptyData} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('allows switching to weekly view with empty datasets', () => {
    render(<PRTrendChart data={emptyData} />);

    fireEvent.click(screen.getByText('Weekly'));

    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('allows switching back to monthly view with empty datasets', () => {
    render(<PRTrendChart data={emptyData} />);

    fireEvent.click(screen.getByText('Weekly'));
    fireEvent.click(screen.getByText('Monthly'));

    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('maintains DOM structure with fully zeroed insight data', () => {
    const { container } = render(<PRTrendChart data={emptyData} />);

    expect(container.querySelector('.rounded-3xl')).toBeInTheDocument();
    expect(container.querySelector('.flex.flex-col')).toBeInTheDocument();
  });
});
