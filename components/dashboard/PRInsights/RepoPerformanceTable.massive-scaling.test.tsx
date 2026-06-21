import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import RepoPerformanceTable from './RepoPerformanceTable';
import type { PRInsightData } from '@/services/github/pr-insights';

const createMockData = (repos: PRInsightData['repoPerformance']): PRInsightData => ({
  totalPRs: 0,
  prs: [],
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

  repoPerformance: repos,

  highlights: {},
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('RepoPerformanceTable Massive Scaling', () => {
  const createRepo = (index: number) => ({
    name: `owner-${index}/repository-${index}`,
    totalPRs: index * 10,
    mergeRate: 95,
    reviewCount: index * 2,
    avgReviewTime: 24,
  });

  it('renders a large repository dataset without crashing', () => {
    const repos = Array.from({ length: 1000 }, (_, i) => createRepo(i));

    render(<RepoPerformanceTable data={createMockData(repos)} />);

    expect(screen.getByText('Repository Performance')).toBeInTheDocument();
  });

  it('renders first and last repositories from a massive dataset', () => {
    const repos = Array.from({ length: 1000 }, (_, i) => createRepo(i));

    render(<RepoPerformanceTable data={createMockData(repos)} />);

    expect(screen.getByText('repository-0')).toBeInTheDocument();
    expect(screen.getByText('repository-999')).toBeInTheDocument();
  });

  it('renders extremely large metric values', () => {
    const repos = [
      {
        name: 'huge/repo',
        totalPRs: 999999999,
        prs: [],
        mergeRate: 100,
        reviewCount: 999999,
        avgReviewTime: 24,
      },
    ];

    render(<RepoPerformanceTable data={createMockData(repos)} />);

    expect(screen.getByText('999999999')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders all table headers with large datasets', () => {
    const repos = Array.from({ length: 500 }, (_, i) => createRepo(i));

    render(<RepoPerformanceTable data={createMockData(repos)} />);

    expect(screen.getByText('Repository')).toBeInTheDocument();
    expect(screen.getByText('PRs')).toBeInTheDocument();
    expect(screen.getByText('Merge Rate')).toBeInTheDocument();
    expect(screen.getByText('Reviews')).toBeInTheDocument();
  });

  it('renders many rows while preserving table structure', () => {
    const repos = Array.from({ length: 250 }, (_, i) => createRepo(i));

    render(<RepoPerformanceTable data={createMockData(repos)} />);

    expect(screen.getAllByRole('row').length).toBeGreaterThan(200);
  });
});
