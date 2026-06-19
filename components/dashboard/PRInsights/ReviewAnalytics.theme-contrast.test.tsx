import { render, screen } from '@testing-library/react';
import ReviewAnalytics from './ReviewAnalytics';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

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

  weeklyActivity: [],
  monthlyActivity: [],

  reviewsGiven: 25,
  reviewsReceived: 18,
  avgReviewResponseTime: 6,
  fastestReview: 2.5,
  slowestReview: 48.7,

  repoPerformance: [],

  highlights: {},
};

describe('ReviewAnalytics Theme Contrast', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('renders correctly in light mode', () => {
    render(<ReviewAnalytics data={mockData} />);

    expect(screen.getByText('Review Analytics')).toBeInTheDocument();
    expect(screen.getByText('Reviews Given')).toBeInTheDocument();
    expect(screen.getByText('Reviews Received')).toBeInTheDocument();
  });

  it('renders correctly in dark mode', () => {
    document.documentElement.classList.add('dark');

    render(<ReviewAnalytics data={mockData} />);

    expect(screen.getByText('Review Analytics')).toBeInTheDocument();
    expect(screen.getByText('Reviews Given')).toBeInTheDocument();
  });

  it('contains dark and light contrast classes on container', () => {
    const { container } = render(<ReviewAnalytics data={mockData} />);

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toContain('bg-white');
    expect(wrapper.className).toContain('dark:bg-zinc-900/50');
    expect(wrapper.className).toContain('border-black/10');
    expect(wrapper.className).toContain('dark:border-white/10');
  });

  it('contains text contrast classes for headings', () => {
    render(<ReviewAnalytics data={mockData} />);

    const heading = screen.getByText('Review Analytics');

    expect(heading.className).toContain('text-gray-900');
    expect(heading.className).toContain('dark:text-white');
  });

  it('renders review metrics without clipping content', () => {
    render(<ReviewAnalytics data={mockData} />);

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText(/2.5/)).toBeInTheDocument();
    expect(screen.getByText(/48.7/)).toBeInTheDocument();
  });
});
