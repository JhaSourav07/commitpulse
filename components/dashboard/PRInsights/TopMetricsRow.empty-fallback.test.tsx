import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TopMetricsRow from './TopMetricsRow';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('TopMetricsRow Empty/Missing Inputs Verification', () => {
  it('renders successfully with zero-value metrics without crashing', () => {
    render(
      <TopMetricsRow
        data={
          {
            totalPRs: 0,
            mergeRate: 0,
            avgCycleTime: 0,
            avgTimeToFirstReview: 0,
            weeklyActivity: [],
          } as never
        }
      />
    );

    expect(screen.getByText('Total PRs')).toBeInTheDocument();
    expect(screen.getByText('Merge Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Cycle Time')).toBeInTheDocument();
    expect(screen.getByText('First Review')).toBeInTheDocument();

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getAllByText('0.0')).toHaveLength(3);
  });

  it('renders normally when weeklyActivity is empty and does not show a trend badge', () => {
    render(
      <TopMetricsRow
        data={
          {
            totalPRs: 42,
            mergeRate: 75,
            avgCycleTime: 12,
            avgTimeToFirstReview: 3,
            weeklyActivity: [],
          } as never
        }
      />
    );

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.queryByText(/this week/i)).not.toBeInTheDocument();
  });

  it('renders a trend badge using the latest weekly activity entry', () => {
    render(
      <TopMetricsRow
        data={
          {
            totalPRs: 120,
            mergeRate: 81.2,
            avgCycleTime: 6.4,
            avgTimeToFirstReview: 1.8,
            weeklyActivity: [{ prs: 4 }, { prs: 7 }, { prs: 13 }],
          } as never
        }
      />
    );

    expect(screen.getByText('+13 this week')).toBeInTheDocument();
  });

  it('formats decimal metrics to one decimal place', () => {
    render(
      <TopMetricsRow
        data={
          {
            totalPRs: 250,
            mergeRate: 98.765,
            avgCycleTime: 12.349,
            avgTimeToFirstReview: 1.256,
            weeklyActivity: [],
          } as never
        }
      />
    );

    expect(screen.getByText('98.8')).toBeInTheDocument();
    expect(screen.getByText('12.3')).toBeInTheDocument();
    expect(screen.getByText('1.3')).toBeInTheDocument();

    expect(screen.getByText('%')).toBeInTheDocument();
    expect(screen.getAllByText('hrs')).toHaveLength(2);
  });

  it('renders extreme metric values while preserving the metric card layout', () => {
    const { container } = render(
      <TopMetricsRow
        data={
          {
            totalPRs: 999999,
            mergeRate: 100,
            avgCycleTime: 99999.9,
            avgTimeToFirstReview: 88888.8,
            weeklyActivity: [{ prs: 50000 }],
          } as never
        }
      />
    );

    expect(screen.getByText('999999')).toBeInTheDocument();
    expect(screen.getByText('100.0')).toBeInTheDocument();
    expect(screen.getByText('99999.9')).toBeInTheDocument();
    expect(screen.getByText('88888.8')).toBeInTheDocument();
    expect(screen.getByText('+50000 this week')).toBeInTheDocument();

    expect(
      container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4')
    ).toBeInTheDocument();
  });
});
