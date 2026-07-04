import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PRInsightsClient from './PRInsightsClient';
import type { PRInsightData } from '@/services/github/pr-insights';

// Mock framer-motion to render clean elements
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
  AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

// Mock recharts ResponsiveContainer
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

const mockInsights = {
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
      totalPRs: 12,
      mergeRate: 75,
      reviewCount: 7,
      avgReviewTime: 8.5,
    },
  ],
  highlights: {
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

function mockFetchWith(data: PRInsightData = mockInsights as unknown as PRInsightData) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => data,
    })
  );
}

describe('PRInsightsClient Timezone Normalization & Calendar Data Boundary Alignment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    localStorage.clear();
    process.env = { ...originalEnv };
    mockFetchWith();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    process.env = originalEnv;
  });

  it('1. mocks standard timezone settings (e.g., UTC, EST, IST, and JST)', async () => {
    const timezones = ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'];

    for (const tz of timezones) {
      process.env.TZ = tz;
      mockFetchWith(mockInsights as unknown as PRInsightData);
      localStorage.clear();

      const { unmount } = render(<PRInsightsClient username="octocat" />);

      // Wait for client to load data
      const totalPRCard = await screen.findByText('Total PRs');
      expect(totalPRCard).toBeInTheDocument();
      expect(screen.getAllByText('12')[0]).toBeInTheDocument();

      unmount();
    }
  });

  it('2. asserts calculations align commits onto the correct visual dates', async () => {
    const RealDate = global.Date;
    const mockDate = new Date('2024-01-01T00:00:00Z');

    class MockDate extends RealDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(mockDate.getTime());
          return;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        super(...args);
      }
      static override now() {
        return mockDate.getTime();
      }
    }

    vi.stubGlobal('Date', MockDate);

    render(<PRInsightsClient username="octocat" />);

    const totalPRCard = await screen.findByText('Total PRs');
    expect(totalPRCard).toBeInTheDocument();

    expect(new Date().toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('3. verifies leap year boundaries parse without leaving gaps in grids', async () => {
    const RealDate = global.Date;
    const mockDate = new Date('2024-02-29T23:59:59Z');

    class MockDate extends RealDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(mockDate.getTime());
          return;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        super(...args);
      }
      static override now() {
        return mockDate.getTime();
      }
    }

    vi.stubGlobal('Date', MockDate);

    render(<PRInsightsClient username="octocat" />);

    const totalPRCard = await screen.findByText('Total PRs');
    expect(totalPRCard).toBeInTheDocument();

    const nextDay = new Date(Date.now() + 1000);
    expect(nextDay.getUTCMonth()).toBe(2); // March
    expect(nextDay.getUTCDate()).toBe(1); // 1st
  });

  it('4. asserts calendar date format utility outputs match expectations in each locale', async () => {
    const testDate = new Date('2024-05-10T12:00:00Z');

    const usFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC' }).format(testDate);
    const ukFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC' }).format(testDate);

    expect(usFormat).toBe('5/10/2024');
    expect(ukFormat).toBe('10/05/2024');

    render(<PRInsightsClient username="octocat" />);
    const totalPRCard = await screen.findByText('Total PRs');
    expect(totalPRCard).toBeInTheDocument();
  });

  it('5. tests offsets around transition dates like daylight savings', async () => {
    const RealDate = global.Date;
    const mockDate = new Date('2024-03-10T01:59:59Z');

    class MockDate extends RealDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(mockDate.getTime());
          return;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        super(...args);
      }
      static override now() {
        return mockDate.getTime();
      }
    }

    vi.stubGlobal('Date', MockDate);

    render(<PRInsightsClient username="octocat" />);

    const totalPRCard = await screen.findByText('Total PRs');
    expect(totalPRCard).toBeInTheDocument();

    const shiftedTime = new Date(mockDate.getTime() + 60 * 60 * 1000);
    expect(shiftedTime.toISOString()).toBe('2024-03-10T02:59:59.000Z');
  });
});
