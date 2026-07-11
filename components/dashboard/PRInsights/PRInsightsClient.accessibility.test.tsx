import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PRInsightsClient from './PRInsightsClient';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({
          children,
          // strip every Framer Motion prop that React doesn't understand
          animate: _a,
          initial: _i,
          exit: _e,
          transition: _tr,
          whileHover: _wh,
          whileTap: _wt,
          whileFocus: _wf,
          whileInView: _wiv,
          onHoverStart: _ohs,
          onHoverEnd: _ohe,
          onAnimationStart: _oas,
          onAnimationComplete: _oac,
          variants: _v,
          layout: _l,
          layoutId: _lid,
          ...props
        }: Record<string, unknown>) =>
          React.createElement(tag, props, children as React.ReactNode),
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
  prs: [],
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

describe('PRInsightsClient accessibility compliance', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    mockFetchWith();
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('exposes accessible names through real headings, links, and table coordinates', async () => {
    await renderLoadedClient();

    expect(screen.getByRole('heading', { name: 'Activity Trends' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Status Distribution' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Repository Performance' })).toBeInTheDocument();

    const fastestLink = screen.getByRole('link', {
      name: /Fastest Merged PR\s+2\.5 hrs\s+Improve dashboard rendering/i,
    });
    expect(fastestLink).toHaveAttribute('href', 'https://example.com/pr/1');

    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Repository' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Merge Rate' })).toBeInTheDocument();
  });

  it('keeps focusable controls visible and avoids suppressing outline behavior', async () => {
    await renderLoadedClient();

    const weekly = screen.getByRole('button', { name: 'Weekly' });
    const monthly = screen.getByRole('button', { name: 'Monthly' });

    weekly.focus();
    expect(weekly).toHaveFocus();
    expect(weekly.className).not.toContain('outline-none');

    monthly.focus();
    expect(monthly).toHaveFocus();
    expect(monthly.className).not.toContain('outline-none');
  });

  it('provides tooltip-style repository labels for truncated names', async () => {
    await renderLoadedClient();

    expect(screen.getAllByTitle('commitpulse/app').length).toBeGreaterThanOrEqual(1);
    screen.getAllByTitle('commitpulse/app').forEach((el) => {
      expect(el).toHaveTextContent('app');
    });
    expect(screen.getAllByTitle('commitpulse/docs').length).toBeGreaterThanOrEqual(1);
    screen.getAllByTitle('commitpulse/docs').forEach((el) => {
      expect(el).toHaveTextContent('docs');
    });
  });

  it('supports normal keyboard tab order across chart controls and PR highlight links', async () => {
    const user = userEvent.setup();
    await renderLoadedClient();

    const chartHeading = screen.getByRole('heading', { name: 'Activity Trends' });
    const chartSection = chartHeading.closest('.bg-white');
    expect(chartSection).not.toBeNull();

    const weekly = within(chartSection as HTMLElement).getByRole('button', { name: 'Weekly' });
    const monthly = within(chartSection as HTMLElement).getByRole('button', { name: 'Monthly' });
    const fastestLink = screen.getByRole('link', {
      name: /Fastest Merged PR\s+2\.5 hrs\s+Improve dashboard rendering/i,
    });

    weekly.focus();
    expect(weekly).toHaveFocus();

    await user.tab();
    expect(monthly).toHaveFocus();

    await user.tab();
    expect(fastestLink).toHaveFocus();
  });

  it('renders headings with a logical structural hierarchy', async () => {
    await renderLoadedClient();

    const headings = screen.getAllByRole('heading');
    const levels = headings.map((heading) => Number(heading.tagName.slice(1)));

    expect(levels).toEqual(expect.arrayContaining([2, 3]));
    expect(Math.min(...levels)).toBe(2);
    expect(Math.max(...levels)).toBe(3);
    expect(new Set(levels)).toEqual(new Set([2, 3]));
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(6);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(8);
  });
});
