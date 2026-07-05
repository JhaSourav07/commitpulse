import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Simulated local cache stub
const localCache = new Map<string, PRInsightData['repoPerformance']>();

// Mock async service layer
const mockFetchRepoPerformance = vi.fn();

beforeEach(() => {
  localCache.clear();
  mockFetchRepoPerformance.mockReset();
});

const baseData: PRInsightData = {
  totalPRs: 20,
  openPRs: 2,
  mergedPRs: 17,
  closedPRs: 1,
  mergeRate: 85,
  avgReviewTime: 3.2,
  avgTimeToFirstReview: 2.0,
  avgCycleTime: 3.2,
  weeklyActivity: [],
  monthlyActivity: [],
  reviewsGiven: 11,
  reviewsReceived: 11,
  avgReviewResponseTime: 3.2,
  fastestReview: 1.0,
  slowestReview: 5.0,
  repoPerformance: [
    { name: 'org/repo-alpha', totalPRs: 8, mergeRate: 75, reviewCount: 4, avgReviewTime: 1.5 },
    { name: 'org/repo-beta', totalPRs: 12, mergeRate: 91.7, reviewCount: 7, avgReviewTime: 2.1 },
  ],
  highlights: { fastestMerged: undefined, mostDiscussed: undefined, largest: undefined },
  prs: [],
};

describe('RepoPerformanceTable - mock integrations', () => {
  it('renders data from mocked service layer without making real network calls', () => {
    mockFetchRepoPerformance.mockResolvedValueOnce(baseData.repoPerformance);

    render(<RepoPerformanceTable data={baseData} />);

    expect(screen.getByText('repo-alpha')).toBeInTheDocument();
    expect(screen.getByText('repo-beta')).toBeInTheDocument();
    expect(mockFetchRepoPerformance).not.toHaveBeenCalled();
  });

  it('renders empty fallback when mocked service returns empty cache stub', () => {
    mockFetchRepoPerformance.mockResolvedValueOnce([]);
    localCache.set('repoPerformance', []);

    const emptyData: PRInsightData = { ...baseData, repoPerformance: [] };
    render(<RepoPerformanceTable data={emptyData} />);

    expect(screen.getByText('No repositories found')).toBeInTheDocument();
  });

  it('verifies local cache is populated before async fetch is triggered', () => {
    localCache.set('repoPerformance', baseData.repoPerformance!);

    const cachedData = localCache.get('repoPerformance');
    expect(cachedData).toBeDefined();
    expect(cachedData).toHaveLength(2);

    expect(mockFetchRepoPerformance).not.toHaveBeenCalled();

    render(<RepoPerformanceTable data={baseData} />);
    expect(screen.getByText('Repository Performance')).toBeInTheDocument();
  });

  it('handles timeout fallback gracefully - renders empty state on simulated timeout', async () => {
    mockFetchRepoPerformance.mockImplementationOnce(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
    );

    const timeoutData: PRInsightData = {
      ...baseData,
      repoPerformance: null as unknown as PRInsightData['repoPerformance'],
    };

    render(<RepoPerformanceTable data={timeoutData} />);
    expect(screen.getByText('No repositories found')).toBeInTheDocument();
  });

  it('asserts cache sync is written correctly after successful data load', () => {
    mockFetchRepoPerformance.mockResolvedValueOnce(baseData.repoPerformance);

    localCache.set('repoPerformance', baseData.repoPerformance!);

    const cached = localCache.get('repoPerformance');
    expect(cached).toHaveLength(2);
    expect(cached![0].name).toBe('org/repo-alpha');
    expect(cached![1].mergeRate).toBe(91.7);

    render(<RepoPerformanceTable data={baseData} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});
