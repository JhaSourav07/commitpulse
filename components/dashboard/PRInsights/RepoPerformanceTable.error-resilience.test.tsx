import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RepoPerformanceTable from './RepoPerformanceTable';
import type { PRInsightData } from '@/services/github/pr-insights';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

// Mock TranslationContext
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.prInsights.no_repos': 'No repositories found',
        'dashboard.prInsights.repo_title': 'Repository Performance',
        'dashboard.prInsights.repo_subtitle': 'PR stats by repository',
        'dashboard.prInsights.repo_header': 'Repository',
        'dashboard.prInsights.prs_header': 'PRs',
        'dashboard.prInsights.merge_rate_header': 'Merge Rate',
        'dashboard.prInsights.reviews_header': 'Reviews',
      };
      return translations[key] || key;
    },
  }),
}));

const mockData: PRInsightData = {
  totalPRs: 13,
  openPRs: 2,
  mergedPRs: 10,
  closedPRs: 1,
  mergeRate: 76.9,
  avgReviewTime: 4.5,
  avgTimeToFirstReview: 3.0,
  avgCycleTime: 4.5,
  weeklyActivity: [],
  monthlyActivity: [],
  reviewsGiven: 7,
  reviewsReceived: 7,
  avgReviewResponseTime: 4.5,
  fastestReview: 1.0,
  slowestReview: 6.0,
  repoPerformance: [
    {
      name: 'owner/repo-one',
      totalPRs: 10,
      mergeRate: 80,
      reviewCount: 5,
      avgReviewTime: 1.8,
    },
    {
      name: 'owner/repo-two',
      totalPRs: 3,
      mergeRate: 66.7,
      reviewCount: 2,
      avgReviewTime: 3.4,
    },
  ],
  highlights: {
    fastestMerged: undefined,
    mostDiscussed: undefined,
    largest: undefined,
  },
  prs: [],
};

describe('RepoPerformanceTable - error resilience', () => {
  it('renders empty state fallback UI when repoPerformance is an empty array', () => {
    const emptyData: PRInsightData = { ...mockData, repoPerformance: [] };
    render(<RepoPerformanceTable data={emptyData} />);

    expect(screen.getByText('No repositories found')).toBeInTheDocument();
  });

  it('renders empty state fallback UI when repoPerformance is null', () => {
    const nullData: PRInsightData = {
      ...mockData,
      repoPerformance: null as unknown as PRInsightData['repoPerformance'],
    };
    render(<RepoPerformanceTable data={nullData} />);

    expect(screen.getByText('No repositories found')).toBeInTheDocument();
  });

  it('renders table correctly with valid repo data without crashing', () => {
    render(<RepoPerformanceTable data={mockData} />);

    expect(screen.getByText('Repository Performance')).toBeInTheDocument();
    expect(screen.getByText('repo-one')).toBeInTheDocument();
    expect(screen.getByText('repo-two')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('handles repo name without slash gracefully without throwing', () => {
    const noSlashData: PRInsightData = {
      ...mockData,
      repoPerformance: [
        {
          name: 'standalone-repo',
          totalPRs: 5,
          mergeRate: 100,
          reviewCount: 3,
          avgReviewTime: 2.0,
        },
      ],
    };
    render(<RepoPerformanceTable data={noSlashData} />);

    const repoElements = screen.getAllByText('standalone-repo');
    expect(repoElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders merge rate progress bar width correctly without overflow errors', () => {
    const { container } = render(<RepoPerformanceTable data={mockData} />);

    const progressBars = container.querySelectorAll('.bg-cyan-500');
    expect(progressBars).toHaveLength(2);

    const firstBar = progressBars[0] as HTMLElement;
    expect(firstBar.style.width).toBe('80%');

    const secondBar = progressBars[1] as HTMLElement;
    expect(secondBar.style.width).toBe('66.7%');
  });
});
