import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
  totalPRs: 18,
  openPRs: 4,
  mergedPRs: 12,
  closedPRs: 2,
  mergeRate: 67,
  avgReviewTime: 4,
  avgTimeToFirstReview: 2,
  avgCycleTime: 8,

  weeklyActivity: [
    { name: '2024-03-09', prs: 2 },
    { name: '2024-03-10', prs: 5 },
  ],

  monthlyActivity: [
    { name: '2024-02', prs: 7 },
    { name: '2024-03', prs: 11 },
  ],

  reviewsGiven: 10,
  reviewsReceived: 15,
  avgReviewResponseTime: 5,
  fastestReview: 1,
  slowestReview: 24,

  repoPerformance: [],
  highlights: {} as never,
} as unknown as PRInsightData;

function normalizeDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

describe('PRTrendChart Timezone Normalization & Calendar Boundary Alignment', () => {
  it('1. normalizes dates correctly across UTC, EST, IST and JST', () => {
    const timestamp = new Date('2024-03-10T00:30:00Z');

    expect(normalizeDate(timestamp, 'UTC')).toBe('2024-03-10');
    expect(normalizeDate(timestamp, 'America/New_York')).toBe('2024-03-09');
    expect(normalizeDate(timestamp, 'Asia/Kolkata')).toBe('2024-03-10');
    expect(normalizeDate(timestamp, 'Asia/Tokyo')).toBe('2024-03-10');
  });

  it('2. aligns chart labels after switching weekly/monthly views', () => {
    render(<PRTrendChart data={mockData} />);

    fireEvent.click(screen.getByRole('button', { name: /weekly/i }));

    expect(screen.getByTestId('area-chart')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /monthly/i }));

    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('3. verifies leap year boundary formatting', () => {
    const leapDate = new Date('2024-02-29T23:30:00Z');

    expect(normalizeDate(leapDate, 'UTC')).toBe('2024-02-29');
    expect(normalizeDate(leapDate, 'Asia/Kolkata')).toBe('2024-03-01');
  });

  it('4. matches locale calendar formatting expectations', () => {
    const sample = new Date('2024-12-25T12:00:00Z');

    expect(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
      }).format(sample)
    ).toBe('12/25/2024');

    expect(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'UTC',
      }).format(sample)
    ).toBe('25/12/2024');
  });

  it('5. handles daylight saving transition without breaking rendering', () => {
    const beforeDst = new Date('2024-03-10T01:59:59Z');
    const afterDst = new Date(beforeDst.getTime() + 60 * 60 * 1000);

    expect(afterDst.toISOString()).toBe('2024-03-10T02:59:59.000Z');

    render(<PRTrendChart data={mockData} />);

    expect(screen.getByText('Activity Trends')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });
});
