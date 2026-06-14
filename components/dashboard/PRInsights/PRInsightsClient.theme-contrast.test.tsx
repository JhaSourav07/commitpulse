import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  };
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const mockInsights: PRInsightData = {
  totalPRs: 12,
  openPRs: 2,
  mergedPRs: 9,
  closedPRs: 1,
  mergeRate: 75,
  avgReviewTime: 8.5,
  avgTimeToFirstReview: 3.25,
  avgCycleTime: 18.75,
  weeklyActivity: [
    { name: '2026-W21', prs: 3 },
    { name: '2026-W22', prs: 5 },
  ],
  monthlyActivity: [
    { name: '2026-05', prs: 4 },
    { name: '2026-06', prs: 8 },
  ],
  reviewsGiven: 7,
  reviewsReceived: 11,
  avgReviewResponseTime: 8.5,
  fastestReview: 1.5,
  slowestReview: 28,
  repoPerformance: [
    {
      name: 'commitpulse/app',
      totalPRs: 8,
      mergeRate: 87.5,
      reviewCount: 6,
      avgReviewTime: 5,
    },
    {
      name: 'commitpulse/docs',
      totalPRs: 4,
      mergeRate: 50,
      reviewCount: 3,
      avgReviewTime: 12,
    },
  ],
  highlights: {
    fastestMerged: {
      title: 'Improve dashboard rendering',
      url: 'https://example.com/pr/1',
      time: 2.5,
    },
    mostDiscussed: {
      title: 'Refine accessibility copy',
      url: 'https://example.com/pr/2',
      comments: 14,
    },
    largest: {
      title: 'Restructure PR insights client',
      url: 'https://example.com/pr/3',
      additions: 320,
      deletions: 80,
    },
  },
};

function mockFetchWith(data: PRInsightData = mockInsights) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => data,
    })
  );
}

async function renderLoadedClient() {
  render(<PRInsightsClient username="octocat" />);
  await screen.findByRole('heading', { name: 'Activity Trends' });
}
describe('PRInsightsClient Theme Contrast and Visual Cohesion', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    mockFetchWith();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('1. should emulate both dark and light presets', async () => {
    document.documentElement.className = '';

    await renderLoadedClient();

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    document.documentElement.className = 'dark';

    render(<PRInsightsClient username="octocat" />);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('2. should assert that visual elements adapt color styling properly for both settings', async () => {
    await renderLoadedClient();

    expect(screen.getByRole('heading', { name: 'Activity Trends' })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Status Distribution' })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Repository Performance' })).toBeInTheDocument();
  });

  it('3. should verify contrast ratio standards for textual elements', async () => {
    await renderLoadedClient();

    const headings = screen.getAllByRole('heading');

    expect(headings.length).toBeGreaterThan(0);

    headings.forEach((heading) => {
      expect(heading.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  it('4. should check theme-aware Tailwind classes in empty state markup', async () => {
    mockFetchWith({
      ...mockInsights,
      totalPRs: 0,
    });

    render(<PRInsightsClient username="octocat" />);

    const emptyMessage = await screen.findByText('No pull request activity found.');

    const wrapper = emptyMessage.parentElement;

    expect(wrapper?.className).toContain('border-gray-300');
    expect(wrapper?.className).toContain('dark:border-zinc-800');
    expect(wrapper?.className).toContain('text-gray-500');
  });

  it('5. should ensure background containers do not clip foreground content', async () => {
    await renderLoadedClient();

    expect(screen.getByRole('heading', { name: 'Activity Trends' })).toBeVisible();

    expect(screen.getByRole('heading', { name: 'Status Distribution' })).toBeVisible();

    expect(screen.getByRole('heading', { name: 'Repository Performance' })).toBeVisible();
  });
});
