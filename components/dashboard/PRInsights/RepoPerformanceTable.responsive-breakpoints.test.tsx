import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PRInsightData } from '@/services/github/pr-insights';
import RepoPerformanceTable from './RepoPerformanceTable';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockData: PRInsightData = {
  totalPRs: 20,
  openPRs: 3,
  mergedPRs: 15,
  closedPRs: 2,
  mergeRate: 75,
  avgReviewTime: 4,
  avgTimeToFirstReview: 2,
  avgCycleTime: 24,
  weeklyActivity: [],
  monthlyActivity: [],
  reviewsGiven: 6,
  reviewsReceived: 8,
  avgReviewResponseTime: 4,
  fastestReview: 1,
  slowestReview: 10,
  repoPerformance: [
    {
      name: 'owner/commitpulse',
      totalPRs: 12,
      mergeRate: 75,
      reviewCount: 5,
      avgReviewTime: 4,
    },
    {
      name: 'owner/mobile-dashboard',
      totalPRs: 8,
      mergeRate: 50,
      reviewCount: 3,
      avgReviewTime: 5,
    },
  ],
  highlights: {},
  prs: [],
};

describe('RepoPerformanceTable responsive breakpoints', () => {
  it('renders inside an overflow-hidden responsive container', () => {
    render(<RepoPerformanceTable data={mockData} />);

    const container = screen
      .getByText('dashboard.prInsights.repo_title')
      .closest('div')?.parentElement;

    expect(container).toHaveClass('overflow-hidden');
    expect(container).toHaveClass('flex');
    expect(container).toHaveClass('flex-col');
  });

  it('uses an overflow-auto table wrapper for smaller viewports', () => {
    render(<RepoPerformanceTable data={mockData} />);

    const table = screen.getByRole('table');
    const wrapper = table.parentElement;

    expect(wrapper).toHaveClass('overflow-auto');
    expect(wrapper).toHaveClass('flex-1');
  });

  it('keeps repository name columns truncated for mobile widths', () => {
    render(<RepoPerformanceTable data={mockData} />);

    const repoName = screen.getByText('commitpulse');

    expect(repoName).toHaveClass('truncate');
    expect(repoName).toHaveClass('max-w-[150px]');
    expect(repoName).toHaveClass('sm:max-w-[200px]');
  });

  it('keeps table columns aligned without absolute fixed widths', () => {
    render(<RepoPerformanceTable data={mockData} />);

    const table = screen.getByRole('table');

    expect(table).toHaveClass('w-full');
    expect(table).toHaveClass('border-collapse');
    expect(table).not.toHaveClass('w-[1000px]');
  });

  it('renders compact repository metadata for mobile-friendly layout', () => {
    render(<RepoPerformanceTable data={mockData} />);

    const owner = screen.getAllByText('owner')[0];

    expect(owner).toHaveClass('text-xs');
    expect(owner).toHaveClass('truncate');
    expect(owner).toHaveClass('max-w-[150px]');
  });
});
