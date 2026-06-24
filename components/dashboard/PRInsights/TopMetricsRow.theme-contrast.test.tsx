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

describe('TopMetricsRow Theme Contrast', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('renders correctly in light mode', () => {
    render(<TopMetricsRow data={mockData} />);

    expect(screen.getByText('Total PRs')).toBeInTheDocument();
    expect(screen.getByText('Merge Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Cycle Time')).toBeInTheDocument();
    expect(screen.getByText('First Review')).toBeInTheDocument();
  });

  it('renders correctly in dark mode', () => {
    document.documentElement.classList.add('dark');

    render(<TopMetricsRow data={mockData} />);

    expect(screen.getByText('Total PRs')).toBeInTheDocument();
    expect(screen.getByText('Merge Rate')).toBeInTheDocument();
  });

  it('contains dark and light contrast classes on metric cards', () => {
    const { container } = render(<TopMetricsRow data={mockData} />);

    const cards = container.querySelectorAll('.bg-white.dark\\:bg-zinc-900\\/50');

    expect(cards.length).toBeGreaterThan(0);

    cards.forEach((card) => {
      expect(card.className).toContain('bg-white');
      expect(card.className).toContain('dark:bg-zinc-900/50');
      expect(card.className).toContain('border-black/10');
      expect(card.className).toContain('dark:border-white/10');
    });
  });

  it('contains text contrast classes for metric headings', () => {
    render(<TopMetricsRow data={mockData} />);

    const heading = screen.getByText('Total PRs');

    expect(heading.className).toContain('text-gray-600');
    expect(heading.className).toContain('dark:text-gray-400');
  });

  it('renders metric values without clipping content', () => {
    render(<TopMetricsRow data={mockData} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('80.0')).toBeInTheDocument();
    expect(screen.getByText('24.0')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });
});
