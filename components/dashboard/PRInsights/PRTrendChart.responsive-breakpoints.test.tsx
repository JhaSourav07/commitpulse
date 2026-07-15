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

describe('PRTrendChart responsive breakpoints', () => {
  it('renders the chart inside a ResponsiveContainer', () => {
    render(<PRTrendChart data={mockData} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('configures ResponsiveContainer to fill its parent', () => {
    render(<PRTrendChart data={mockData} />);

    const container = screen.getByTestId('responsive-container');

    expect(container).toHaveAttribute('data-width', '100%');
    expect(container).toHaveAttribute('data-height', '100%');
  });

  it('preserves the responsive chart wrapper layout', () => {
    const { container } = render(<PRTrendChart data={mockData} />);

    const wrapper = container.querySelector('.min-h-\\[300px\\]');

    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('flex-1');
  });

  it('keeps the responsive container mounted while switching chart views', async () => {
    const user = userEvent.setup();

    render(<PRTrendChart data={mockData} />);

    await user.click(screen.getByRole('button', { name: /weekly/i }));

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /monthly/i }));

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('preserves the responsive layout after rerendering with updated data', () => {
    const updatedData = {
      ...mockData,
      weeklyActivity: [
        { name: 'W1', prs: 7 },
        { name: 'W2', prs: 9 },
      ],
    };

    const { rerender } = render(<PRTrendChart data={mockData} />);

    rerender(<PRTrendChart data={updatedData} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('retains its responsive wrapper classes after rerender', () => {
    const { container, rerender } = render(<PRTrendChart data={mockData} />);

    rerender(<PRTrendChart data={mockData} />);

    const wrapper = container.querySelector('.min-h-\\[300px\\]');

    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('flex-1');
  });
});
