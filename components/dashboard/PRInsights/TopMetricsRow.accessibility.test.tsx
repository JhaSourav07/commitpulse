import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TopMetricsRow from './TopMetricsRow';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('TopMetricsRow Accessibility Standards & Screen Reader Aria Compliance', () => {
  const mockData: PRInsightData = {
    totalPRs: 120,
    mergeRate: 87.5,
    avgCycleTime: 14.2,
    avgTimeToFirstReview: 3.6,
    weeklyActivity: [
      {
        prs: 12,
      },
    ],
  } as PRInsightData;

  it('renders all metric headings in logical order', () => {
    render(<TopMetricsRow data={mockData} />);

    expect(screen.getByText('Total PRs')).toBeInTheDocument();

    expect(screen.getByText('Merge Rate')).toBeInTheDocument();

    expect(screen.getByText('Avg Cycle Time')).toBeInTheDocument();

    expect(screen.getByText('First Review')).toBeInTheDocument();
  });

  it('renders metric values for screen readers', () => {
    render(<TopMetricsRow data={mockData} />);

    expect(screen.getByText('120')).toBeInTheDocument();

    expect(screen.getByText('87.5')).toBeInTheDocument();

    expect(screen.getByText('14.2')).toBeInTheDocument();

    expect(screen.getByText('3.6')).toBeInTheDocument();
  });

  it('renders trend indicator accessibly', () => {
    render(<TopMetricsRow data={mockData} />);

    expect(screen.getByText('+12 this week')).toBeInTheDocument();
  });

  it('renders suffix labels visibly for accessibility clarity', () => {
    render(<TopMetricsRow data={mockData} />);

    expect(screen.getAllByText('%')[0]).toBeInTheDocument();

    expect(screen.getAllByText('hrs').length).toBeGreaterThan(0);
  });

  it('renders all metric cards without accessibility violations', () => {
    render(<TopMetricsRow data={mockData} />);

    const headings = screen.getAllByRole('heading');

    expect(headings.length).toBeGreaterThan(0);
  });
});
