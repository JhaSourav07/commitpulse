import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import TopMetricsRow from './TopMetricsRow';
import PRInsightsClient from './PRInsightsClient';
import type { PRInsightData } from '@/services/github/pr-insights';
import { fetchPRInsights } from '@/services/github/pr-insights';
import { DistributedCache } from '@/lib/cache';

// Mock framer-motion to bypass animations in tests

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock recharts because it requires rendering containers
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  CartesianGrid: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
}));

const mockData: PRInsightData = {
  totalPRs: 120,
  openPRs: 20,
  mergedPRs: 80,
  closedPRs: 20,
  mergeRate: 87.5,
  avgReviewTime: 12.0,
  avgTimeToFirstReview: 3.6,
  avgCycleTime: 14.2,
  weeklyActivity: [{ name: 'Week 1', prs: 12 }],
  monthlyActivity: [{ name: 'Month 1', prs: 48 }],
  reviewsGiven: 10,
  reviewsReceived: 15,
  avgReviewResponseTime: 8.0,
  fastestReview: 1.0,
  slowestReview: 24.0,
  repoPerformance: [
    {
      name: 'repo-1',
      totalPRs: 10,
      mergeRate: 90.0,
      reviewCount: 5,
      avgReviewTime: 4.5,
    },
  ],
  highlights: {
    mostDiscussed: { title: 'PR 1', url: 'https://github.com/1', comments: 10 },
    fastestMerged: { title: 'PR 2', url: 'https://github.com/2', time: 1.2 },
    largest: { title: 'PR 3', url: 'https://github.com/3', additions: 100, deletions: 50 },
  },
  prs: [
    {
      title: 'PR 1',
      url: 'https://github.com/1',
      state: 'MERGED',
      createdAt: '2026-07-04T00:00:00Z',
      repo: 'repo-1',
    },
  ],
};

describe('TopMetricsRow & PRInsights Service Mock Integrations', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = globalThis.fetch;
    // Set up mock token environments to avoid "GitHub token is missing" errors
    vi.stubEnv('GITHUB_TOKEN', 'ghp_123456789012345678901234567890123456');
    vi.stubEnv('GITHUB_PAT', 'ghp_123456789012345678901234567890123456');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  // 1. Mock standard asynchronous imports and databases using stubs.
  it('loads and renders metric values correctly using mocked service layer data', () => {
    render(<TopMetricsRow data={mockData} />);

    expect(screen.getByText('Total PRs')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();

    expect(screen.getByText('Merge Rate')).toBeInTheDocument();
    expect(screen.getByText('87.5')).toBeInTheDocument();

    expect(screen.getByText('Avg Cycle Time')).toBeInTheDocument();
    expect(screen.getByText('14.2')).toBeInTheDocument();

    expect(screen.getByText('First Review')).toBeInTheDocument();
    expect(screen.getByText('3.6')).toBeInTheDocument();
  });

  // 2. Test service loading paths to ensure pending state overlays render.
  it('renders pending state overlay when fetching data is in progress', async () => {
    // Stub fetch to return a promise that never resolves during this test
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

    render(<PRInsightsClient username="test-user" />);

    expect(screen.getByText('Crunching your pull requests...')).toBeInTheDocument();
  });

  // 3. Assert local cache layers are queried before triggering database/API retrievals.
  it('queries the local cache layer before executing service layer retrieval', async () => {
    const getSpy = vi.spyOn(DistributedCache.prototype, 'get').mockResolvedValue(mockData);

    const result = await fetchPRInsights('test-user');

    expect(getSpy).toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });

  // 4. Verify correct fallback procedures during fake endpoint timeout/error blocks.
  it('recovers and renders correct fallback error states when fetching fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    render(<PRInsightsClient username="error-user" />);

    const errorMessage = await screen.findByText(
      /Error loading insights: Failed to fetch PR insights/i
    );
    expect(errorMessage).toBeInTheDocument();
  });

  // 5. Assert complete cache sync is written on success callbacks.
  it('syncs/writes the successfully loaded data to cache on service resolution', async () => {
    // Mock the cache's get to return null so it forces uncached load
    vi.spyOn(DistributedCache.prototype, 'get').mockResolvedValue(null);
    const setSpy = vi.spyOn(DistributedCache.prototype, 'set').mockResolvedValue(undefined);

    // Stub global fetch to return successfully
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === 'x-ratelimit-remaining') return '5000';
          if (name === 'x-ratelimit-reset') return String(Math.floor(Date.now() / 1000) + 3600);
          if (name === 'x-ratelimit-limit') return '5000';
          return null;
        },
      },
      json: async () => ({
        data: {
          authored: {
            nodes: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
          reviewed: { issueCount: 0 },
        },
      }),
    } as Response);

    await fetchPRInsights('new-uncached-user');

    expect(setSpy).toHaveBeenCalled();
  });
});
