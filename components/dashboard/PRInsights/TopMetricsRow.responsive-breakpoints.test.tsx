import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import TopMetricsRow from './TopMetricsRow';

import type { PRInsightData } from '@/services/github/pr-insights';

const mockData: PRInsightData = {
  totalPRs: 100,
  openPRs: 10,
  mergedPRs: 80,
  closedPRs: 10,
  mergeRate: 80,
  avgReviewTime: 12,
  avgTimeToFirstReview: 4,
  avgCycleTime: 24,

  weeklyActivity: [{ name: '2026-W01', prs: 5 }],
  monthlyActivity: [],

  reviewsGiven: 25,
  reviewsReceived: 18,
  avgReviewResponseTime: 6,
  fastestReview: 2.5,
  slowestReview: 48.7,

  repoPerformance: [],
  prs: [],
  highlights: {},
};

describe('TopMetricsRow responsive breakpoints', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });
  it('renders correctly for a standard 375px mobile viewport', () => {
    render(<TopMetricsRow data={mockData} />);

    expect(screen.getByText('Total PRs')).toBeInTheDocument();
    expect(screen.getByText('Merge Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Cycle Time')).toBeInTheDocument();
    expect(screen.getByText('First Review')).toBeInTheDocument();
  });
  it('uses responsive grid breakpoint classes', () => {
    const { container } = render(<TopMetricsRow data={mockData} />);

    const grid = container.firstElementChild as HTMLElement;

    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-4');
    expect(grid).toHaveClass('gap-6');
  });
  it('avoids fixed-width classes that could cause horizontal scrolling', () => {
    const { container } = render(<TopMetricsRow data={mockData} />);

    const cards = container.querySelectorAll('.bg-white');

    cards.forEach((card) => {
      expect(card.className).not.toContain('w-screen');
      expect(card.className).not.toContain('w-[');
    });
  });
  it('keeps all metric cards visible on smaller viewports', () => {
    render(<TopMetricsRow data={mockData} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('80.0')).toBeInTheDocument();
    expect(screen.getByText('24.0')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });
  it('keeps all metric cards inside the responsive grid container', () => {
    const { container } = render(<TopMetricsRow data={mockData} />);

    const grid = container.firstElementChild as HTMLElement;

    expect(grid.children).toHaveLength(4);

    Array.from(grid.children).forEach((card) => {
      expect(card).toBeInTheDocument();
    });
  });
});
