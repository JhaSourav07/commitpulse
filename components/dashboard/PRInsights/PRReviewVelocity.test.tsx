import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PRReviewVelocity from './PRReviewVelocity';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key,
  }),
}));

const sampleData: PRInsightData = {
  totalPRs: 20,
  openPRs: 5,
  mergedPRs: 15,
  closedPRs: 0,
  mergeRate: 75,
  avgReviewTime: 14.5,
  avgTimeToFirstReview: 8.2,
  avgCycleTime: 36.4,
  weeklyActivity: [],
  monthlyActivity: [],
  reviewsGiven: 10,
  reviewsReceived: 18,
  avgReviewResponseTime: 14.5,
  fastestReview: 1.0,
  slowestReview: 48.0,
  repoPerformance: [
    {
      name: 'facebook/react',
      totalPRs: 10,
      mergeRate: 80,
      reviewCount: 15,
      avgReviewTime: 12.0,
    },
    {
      name: 'vercel/next.js',
      totalPRs: 10,
      mergeRate: 70,
      reviewCount: 12,
      avgReviewTime: 18.5,
    },
  ],
  highlights: {
    fastestMerged: {
      title: 'Quick fix',
      url: 'https://github.com/example/pr/1',
      time: 2.5,
    },
  },
  prs: [],
};

describe('PRReviewVelocity Component Tests', () => {
  it('renders normal dashboard card with populated data correctly', () => {
    render(<PRReviewVelocity data={sampleData} />);

    expect(screen.getByText('PR Review Velocity')).toBeInTheDocument();
    expect(screen.getByText('Average Review Time by Repository')).toBeInTheDocument();

    expect(screen.getByText('8.2')).toBeInTheDocument();
    expect(screen.getByText('36.4')).toBeInTheDocument();
    expect(screen.getByText('14.5')).toBeInTheDocument();
    expect(screen.getByText('2.5')).toBeInTheDocument();

    expect(screen.getByText('Fast Reviews ⚡')).toBeInTheDocument();

    expect(screen.getByText('facebook/react')).toBeInTheDocument();
    expect(screen.getByText('vercel/next.js')).toBeInTheDocument();
  });

  it('renders empty repository performance state gracefully', () => {
    const emptyRepoData = {
      ...sampleData,
      repoPerformance: [],
    };

    render(<PRReviewVelocity data={emptyRepoData} />);

    expect(screen.getByText('No repository turnaround data available.')).toBeInTheDocument();
  });

  it('handles missing or zero metrics gracefully with fallback formatting', () => {
    const missingData = {
      totalPRs: 0,
      openPRs: 0,
      mergedPRs: 0,
      closedPRs: 0,
      mergeRate: 0,
      avgReviewTime: 0,
      avgTimeToFirstReview: 0,
      avgCycleTime: 0,
      weeklyActivity: [],
      monthlyActivity: [],
      reviewsGiven: 0,
      reviewsReceived: 0,
      avgReviewResponseTime: 0,
      fastestReview: 0,
      slowestReview: 0,
      repoPerformance: [],
      highlights: {},
      prs: [],
    };

    render(<PRReviewVelocity data={missingData} />);

    expect(screen.getByText('PR Review Velocity')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(screen.getAllByText('0.0').length).toBeGreaterThanOrEqual(4);
  });
});
