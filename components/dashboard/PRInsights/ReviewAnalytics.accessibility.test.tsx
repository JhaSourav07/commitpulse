import { render, screen } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { PRInsightData } from '@/services/github/pr-insights';
import ReviewAnalytics from './ReviewAnalytics';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: HTMLAttributes<HTMLDivElement> & {
      children?: ReactNode;
    }) => <div {...props}>{children}</div>,
  },
}));

const mockData: PRInsightData = {
  totalPRs: 100,
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

describe('ReviewAnalytics Accessibility', () => {
  it('renders the analytics heading', () => {
    render(<ReviewAnalytics data={mockData} />);

    expect(
      screen.getByRole('heading', {
        name: /review analytics/i,
      })
    ).toBeInTheDocument();
  });

  it('includes contextual information for screen readers', () => {
    render(<ReviewAnalytics data={mockData} />);

    expect(screen.getByText(/peer review participation and speed/i)).toBeInTheDocument();
  });

  it('renders review metric labels as readable text', () => {
    render(<ReviewAnalytics data={mockData} />);

    expect(screen.getByText('Reviews Given')).toBeInTheDocument();
    expect(screen.getByText('Reviews Received')).toBeInTheDocument();
    expect(screen.getByText('Fastest Review')).toBeInTheDocument();
    expect(screen.getByText('Slowest Review')).toBeInTheDocument();
  });

  it('displays review statistics alongside their labels', () => {
    render(<ReviewAnalytics data={mockData} />);

    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('1.5')).toBeInTheDocument();
    expect(screen.getByText('12.4')).toBeInTheDocument();
  });

  it('shows review duration units for assistive technologies', () => {
    render(<ReviewAnalytics data={mockData} />);

    expect(screen.getAllByText('hrs')).toHaveLength(2);
  });
});
