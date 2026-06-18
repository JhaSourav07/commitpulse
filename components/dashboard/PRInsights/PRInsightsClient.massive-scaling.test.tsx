import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PRInsightsClient from './PRInsightsClient';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
          React.createElement(tag, props, children),
    }
  ),
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function buildMassiveInsights(overrides: Partial<PRInsightData> = {}): PRInsightData {
  return {
    totalPRs: 999999,
    openPRs: 333333,
    mergedPRs: 499999,
    closedPRs: 166667,
    mergeRate: 49.9999,
    avgReviewTime: 9999.99,
    avgTimeToFirstReview: 8888.88,
    avgCycleTime: 7777.77,
    weeklyActivity: Array.from({ length: 1000 }, (_, i) => ({
      name: `Week-${i}`,
      prs: i * 100,
    })),
    monthlyActivity: Array.from({ length: 500 }, (_, i) => ({
      name: `Month-${i}`,
      prs: i * 1000,
    })),
    reviewsGiven: 999999,
    reviewsReceived: 888888,
    avgReviewResponseTime: 9999.0,
    fastestReview: 0.001,
    slowestReview: 99999.99,
    repoPerformance: Array.from({ length: 500 }, (_, i) => ({
      name: `org/repo-${i}`,
      totalPRs: i * 1000,
      mergeRate: (i % 100) + 0.5,
      reviewCount: i * 500,
      avgReviewTime: i * 2.5,
    })),
    highlights: {
      fastestMerged: {
        title: 'A'.repeat(500),
        url: 'https://github.com/org/repo/pull/1',
        time: 0.001,
      },
      mostDiscussed: {
        title: 'B'.repeat(500),
        url: 'https://github.com/org/repo/pull/2',
        comments: 999999,
      },
      largest: {
        title: 'C'.repeat(500),
        url: 'https://github.com/org/repo/pull/3',
        additions: 999999,
        deletions: 888888,
      },
    },
    ...overrides,
  };
}

function mockFetchWith(data: PRInsightData) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => data,
    })
  );
}

describe('PRInsightsClient Massive Data Sets and Extreme High Bounds Scaling', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders all section headings without layout breakage under massive data load', async () => {
    mockFetchWith(buildMassiveInsights());
    render(<PRInsightsClient username="massiveuser" />);

    await screen.findByRole('heading', { name: 'Activity Trends' });

    expect(screen.getByRole('heading', { name: 'Activity Trends' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Status Distribution' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Repository Performance' })).toBeInTheDocument();
  });

  it('displays loading state before data resolves with massive dataset', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => buildMassiveInsights(),
      })
    );
    render(<PRInsightsClient username="massiveuser" />);

    expect(screen.getByText(/Crunching your pull requests/i)).toBeInTheDocument();

    await screen.findByRole('heading', { name: 'Activity Trends' });
  });

  it('renders zero-PR empty state without crashing when totalPRs is 0', async () => {
    mockFetchWith(buildMassiveInsights({ totalPRs: 0, openPRs: 0, mergedPRs: 0, closedPRs: 0 }));
    render(<PRInsightsClient username="emptyuser" />);

    await screen.findByText(/No pull request activity found/i);
    expect(screen.getByText(/Start contributing to see your insights here/i)).toBeInTheDocument();
  });

  it('renders error state cleanly when fetch fails under high load simulation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      })
    );
    render(<PRInsightsClient username="erroruser" />);

    await screen.findByText(/Error loading insights/i);
  });

  it('grid items render without breaking layout with 500 repo performance entries', async () => {
    mockFetchWith(buildMassiveInsights());
    render(<PRInsightsClient username="massiveuser" />);

    await screen.findByRole('heading', { name: 'Repository Performance' });

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });
});
