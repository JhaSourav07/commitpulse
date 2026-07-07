import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PRTrendChart from './PRTrendChart';

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

  CartesianGrid: () => <div data-testid="cartesian-grid" />,

  Tooltip: () => <div data-testid="tooltip" />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: (
      props: React.HTMLAttributes<HTMLDivElement> & {
        initial?: unknown;
        animate?: unknown;
        transition?: unknown;
      }
    ) => {
      const cleanProps = { ...props };

      delete cleanProps.initial;
      delete cleanProps.animate;
      delete cleanProps.transition;

      return <div {...cleanProps} />;
    },
  },
}));

const createMassiveDataset = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    name: `Point-${index}`,
    prs: index + 1,
  }));

const createExtremeDataset = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    name: `Extreme-${index}`,
    prs: (index + 1) * 100000,
  }));

const createChartData = (
  weeklyActivity = createMassiveDataset(1000),
  monthlyActivity = createMassiveDataset(1000)
) => ({
  totalPRs: 500000,
  openPRs: 100000,
  mergedPRs: 350000,
  closedPRs: 50000,
  mergeRate: 70,
  avgReviewTime: 12,
  avgTimeToFirstReview: 4,
  avgCycleTime: 24,
  weeklyActivity,
  monthlyActivity,
  reviewsGiven: 10000,
  reviewsReceived: 9000,
  avgReviewResponseTime: 6,
  fastestReview: 1,
  slowestReview: 72,
  repoPerformance: [],
  highlights: {},
});

describe('PRTrendChart Massive Data Sets and Extreme High Bounds Scaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders successfully with a massive weekly activity dataset', () => {
    render(<PRTrendChart data={createChartData() as never} />);

    expect(screen.getByRole('heading', { name: /activity trends/i })).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('renders successfully with a massive monthly activity dataset', () => {
    render(
      <PRTrendChart
        data={createChartData(createMassiveDataset(10), createMassiveDataset(2000)) as never}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /monthly/i }));

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('supports switching views when both datasets contain thousands of records', () => {
    render(
      <PRTrendChart
        data={createChartData(createMassiveDataset(1500), createMassiveDataset(1500)) as never}
      />
    );

    const weeklyButton = screen.getByRole('button', { name: /weekly/i });
    const monthlyButton = screen.getByRole('button', { name: /monthly/i });

    fireEvent.click(weeklyButton);
    fireEvent.click(monthlyButton);
    fireEvent.click(weeklyButton);

    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('handles extreme high PR values without breaking chart rendering', () => {
    render(
      <PRTrendChart
        data={createChartData(createExtremeDataset(1000), createExtremeDataset(1000)) as never}
      />
    );

    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('area')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('preserves chart layout structure under massive data loads', () => {
    const { container } = render(
      <PRTrendChart
        data={createChartData(createMassiveDataset(2500), createMassiveDataset(2500)) as never}
      />
    );

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper).toHaveClass('rounded-3xl', 'p-6', 'flex', 'flex-col');

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });
});
