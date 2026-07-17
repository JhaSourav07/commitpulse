import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PRTrendChart from './PRTrendChart';
import type { PRInsightData } from '@/services/github/pr-insights';
import userEvent from '@testing-library/user-event';

// Mock framer-motion
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

// Capture ResponsiveContainer props
vi.mock('recharts', () => ({
  ResponsiveContainer: ({
    width,
    height,
    children,
  }: {
    width: string;
    height: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="responsive-container" data-width={width} data-height={height}>
      {children}
    </div>
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
  totalPRs: 20,
  openPRs: 5,
  mergedPRs: 10,
  closedPRs: 5,
  mergeRate: 50,
  avgReviewTime: 12,
  avgTimeToFirstReview: 4,
  avgCycleTime: 24,
  weeklyActivity: [
    { name: 'W1', prs: 2 },
    { name: 'W2', prs: 3 },
  ],
  monthlyActivity: [
    { name: 'M1', prs: 10 },
    { name: 'M2', prs: 15 },
  ],
  reviewsGiven: 8,
  reviewsReceived: 12,
  avgReviewResponseTime: 6,
  fastestReview: 1,
  slowestReview: 24,
  repoPerformance: [],
  highlights: {},
  prs: [],
} as PRInsightData;

describe('PRTrendChart mouse interactivity', () => {
  it('renders weekly and monthly view buttons', () => {
    render(<PRTrendChart data={mockData} />);

    expect(screen.getByRole('button', { name: /weekly/i })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /monthly/i })).toBeInTheDocument();
  });

  it('shows monthly as the default active view', () => {
    render(<PRTrendChart data={mockData} />);

    const weeklyButton = screen.getByRole('button', { name: /weekly/i });
    const monthlyButton = screen.getByRole('button', { name: /monthly/i });

    expect(monthlyButton).toHaveClass('bg-white');
    expect(weeklyButton).not.toHaveClass('bg-white');
  });

  it('switches to the weekly view when the weekly button is clicked', async () => {
    const user = userEvent.setup();

    render(<PRTrendChart data={mockData} />);

    const weeklyButton = screen.getByRole('button', { name: /weekly/i });
    const monthlyButton = screen.getByRole('button', { name: /monthly/i });

    await user.click(weeklyButton);

    expect(weeklyButton).toHaveClass('bg-white');
    expect(monthlyButton).not.toHaveClass('bg-white');
  });

  it('switches back to the monthly view when the monthly button is clicked', async () => {
    const user = userEvent.setup();

    render(<PRTrendChart data={mockData} />);

    const weeklyButton = screen.getByRole('button', { name: /weekly/i });
    const monthlyButton = screen.getByRole('button', { name: /monthly/i });

    await user.click(weeklyButton);
    await user.click(monthlyButton);

    expect(monthlyButton).toHaveClass('bg-white');
    expect(weeklyButton).not.toHaveClass('bg-white');
  });

  it('supports repeated view toggling without losing the active state', async () => {
    const user = userEvent.setup();

    render(<PRTrendChart data={mockData} />);

    const weeklyButton = screen.getByRole('button', { name: /weekly/i });
    const monthlyButton = screen.getByRole('button', { name: /monthly/i });

    await user.click(weeklyButton);
    expect(weeklyButton).toHaveClass('bg-white');

    await user.click(monthlyButton);
    expect(monthlyButton).toHaveClass('bg-white');
    expect(weeklyButton).not.toHaveClass('bg-white');

    await user.click(weeklyButton);
    expect(weeklyButton).toHaveClass('bg-white');
    expect(monthlyButton).not.toHaveClass('bg-white');
  });

  it('keeps the chart mounted during view toggling', async () => {
    const user = userEvent.setup();

    render(<PRTrendChart data={mockData} />);

    const weeklyButton = screen.getByRole('button', { name: /weekly/i });
    const monthlyButton = screen.getByRole('button', { name: /monthly/i });

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();

    await user.click(weeklyButton);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();

    await user.click(monthlyButton);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });
});
