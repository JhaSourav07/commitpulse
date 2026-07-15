import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PRStatusDistribution from './PRStatusDistribution';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  Cell: ({ style }: { style?: React.CSSProperties }) => <div data-testid="cell" style={style} />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

type PRStatusData = React.ComponentProps<typeof PRStatusDistribution>['data'];

const mockData = {
  totalPRs: 10,
  mergedPRs: 5,
  openPRs: 3,
  closedPRs: 2,
  mergeRate: 50,
  avgReviewTime: 2,
  avgTimeToFirstReview: 1,
  avgCycleTime: 3,
  weeklyActivity: [],
  monthlyActivity: [],
  reviewsGiven: 0,
  reviewsReceived: 0,
  avgReviewResponseTime: 0,
  fastestReview: 0,
  slowestReview: 0,
  repoPerformance: [],
  highlights: {},
  prs: [
    {
      title: 'Merged PR Example',
      url: 'https://github.com/test/repo/pull/1',
      state: 'MERGED',
      createdAt: '2026-01-01',
      repo: 'test/repo',
    },
    {
      title: 'Open PR Example',
      url: 'https://github.com/test/repo/pull/2',
      state: 'OPEN',
      createdAt: '2026-01-02',
      repo: 'test/repo',
    },
  ],
} as unknown as PRStatusData;

describe('PRStatusDistribution Mouse Interactivity', () => {
  it('renders interactive filter buttons for available PR states', () => {
    render(<PRStatusDistribution data={mockData} />);

    expect(screen.getByRole('button', { name: /filter by merged prs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filter by open prs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filter by closed prs/i })).toBeInTheDocument();
  });

  it('activates a filter when a legend button is clicked', () => {
    render(<PRStatusDistribution data={mockData} />);

    const mergedButton = screen.getByRole('button', {
      name: /filter by merged prs/i,
    });

    fireEvent.click(mergedButton);

    expect(mergedButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles the filter off when the same legend button is clicked twice', () => {
    render(<PRStatusDistribution data={mockData} />);

    const mergedButton = screen.getByRole('button', {
      name: /filter by merged prs/i,
    });

    fireEvent.click(mergedButton);
    expect(mergedButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(mergedButton);
    expect(mergedButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('displays filtered PR entries after selecting a status filter', () => {
    render(<PRStatusDistribution data={mockData} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: /filter by merged prs/i,
      })
    );

    expect(screen.getByText('Merged PR Example')).toBeInTheDocument();
    expect(screen.getByText('test/repo')).toBeInTheDocument();
  });

  it('renders tooltip and pointer-enabled chart segments for interaction feedback', () => {
    render(<PRStatusDistribution data={mockData} />);

    expect(screen.getByTestId('tooltip')).toBeInTheDocument();

    const cells = screen.getAllByTestId('cell');

    expect(cells.length).toBeGreaterThan(0);

    cells.forEach((cell) => {
      expect(cell).toHaveStyle({
        cursor: 'pointer',
      });
    });
  });
});
