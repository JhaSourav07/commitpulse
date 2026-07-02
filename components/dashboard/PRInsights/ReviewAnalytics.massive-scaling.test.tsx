import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReviewAnalytics from './ReviewAnalytics';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const massiveData: PRInsightData = {
  totalPRs: 999999999,
  prs: [],
  openPRs: 111111111,
  mergedPRs: 777777777,
  closedPRs: 111111111,
  mergeRate: 99.9,

  avgReviewTime: 999999.9,
  avgTimeToFirstReview: 999999.9,
  avgCycleTime: 999999.9,

  weeklyActivity: [],
  monthlyActivity: [],

  reviewsGiven: 999999999,
  reviewsReceived: 888888888,

  avgReviewResponseTime: 999999.9,
  fastestReview: 0.01,
  slowestReview: 999999.9,

  repoPerformance: [],

  highlights: {},
};

describe('ReviewAnalytics — Massive Data Sets & Extreme High Bounds Scaling', () => {
  it('renders extremely large review counts without crashing', () => {
    render(<ReviewAnalytics data={massiveData} />);

    expect(screen.getByText('999999999')).toBeTruthy();
    expect(screen.getByText('888888888')).toBeTruthy();
  });

  it('renders extremely large review duration values', () => {
    render(<ReviewAnalytics data={massiveData} />);

    expect(screen.getByText('999999.9')).toBeTruthy();
  });

  it('renders extremely small fractional review duration values', () => {
    render(<ReviewAnalytics data={massiveData} />);

    expect(screen.getByText(/0.0/i)).toBeTruthy();
  });

  it('renders all analytics cards under massive scaling conditions', () => {
    const { container } = render(<ReviewAnalytics data={massiveData} />);

    const cards = container.querySelectorAll('.rounded-2xl');
    expect(cards.length).toBe(4);
  });

  it('preserves grid layout structure with extreme values', () => {
    const { container } = render(<ReviewAnalytics data={massiveData} />);

    const grid = container.querySelector('.grid-cols-2');
    expect(grid).not.toBeNull();
    expect(grid?.classList.contains('grid')).toBe(true);
  });
});
