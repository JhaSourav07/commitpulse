import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RepoPerformanceTable from './RepoPerformanceTable';
import type { PRInsightData } from '@/services/github/pr-insights';

type MotionDivProps = {
  children?: React.ReactNode;
  className?: string;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: MotionDivProps) => <div className={className}>{children}</div>,
  },
}));

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
      return translations[key] ?? key;
    },
  }),
}));

type RepoPerformance = PRInsightData['repoPerformance'][number];

const DATE_PART_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = DATE_PART_FORMATTER_CACHE.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  DATE_PART_FORMATTER_CACHE.set(timeZone, formatter);
  return formatter;
}

function getVisualDate(timestamp: string | Date, timeZone: string): string {
  const parts = getFormatter(timeZone).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function buildCalendarRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function formatCalendarDate(date: Date, locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function makeRepo(
  name: string,
  totalPRs: number,
  mergeRate = 100,
  reviewCount = 0
): RepoPerformance {
  return {
    name,
    totalPRs,
    mergeRate,
    reviewCount,
    avgReviewTime: 0,
  };
}

function makeData(repoPerformance: RepoPerformance[]): PRInsightData {
  return {
    totalPRs: repoPerformance.reduce((sum, repo) => sum + repo.totalPRs, 0),
    openPRs: 0,
    mergedPRs: repoPerformance.reduce(
      (sum, repo) => sum + Math.round((repo.totalPRs * repo.mergeRate) / 100),
      0
    ),
    closedPRs: 0,
    mergeRate: 0,
    avgReviewTime: 0,
    avgTimeToFirstReview: 0,
    avgCycleTime: 0,
    weeklyActivity: [],
    monthlyActivity: [],
    reviewsGiven: 0,
    reviewsReceived: repoPerformance.reduce((sum, repo) => sum + repo.reviewCount, 0),
    avgReviewResponseTime: 0,
    fastestReview: 0,
    slowestReview: 0,
    repoPerformance,
    highlights: {},
    prs: [],
  };
}

function getRow(repoLabel: string): HTMLElement {
  return screen.getByText(repoLabel).closest('tr') as HTMLElement;
}

describe('RepoPerformanceTable timezone normalization and calendar boundary alignment', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('1. mocks UTC, EST, IST, and JST timezone buckets in rendered repo rows', () => {
    const timestamp = '2024-01-01T02:30:00.000Z';
    const rows = [
      makeRepo(`activity/utc-${getVisualDate(timestamp, 'UTC')}`, 1),
      makeRepo(`activity/est-${getVisualDate(timestamp, 'America/New_York')}`, 2),
      makeRepo(`activity/ist-${getVisualDate(timestamp, 'Asia/Kolkata')}`, 3),
      makeRepo(`activity/jst-${getVisualDate(timestamp, 'Asia/Tokyo')}`, 4),
    ];

    render(<RepoPerformanceTable data={makeData(rows)} />);

    expect(screen.getByText('utc-2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('est-2023-12-31')).toBeInTheDocument();
    expect(screen.getByText('ist-2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('jst-2024-01-01')).toBeInTheDocument();
  });

  it('2. aligns commit timestamps onto the correct visual date rows across offsets', () => {
    const commitTimestamp = '2024-06-30T23:30:00.000Z';
    const rows = [
      makeRepo(`visual/utc-${getVisualDate(commitTimestamp, 'UTC')}`, 1, 100, 2),
      makeRepo(`visual/ist-${getVisualDate(commitTimestamp, 'Asia/Kolkata')}`, 1, 100, 3),
    ];

    render(<RepoPerformanceTable data={makeData(rows)} />);

    expect(screen.getByText('utc-2024-06-30')).toBeInTheDocument();
    expect(screen.getByText('ist-2024-07-01')).toBeInTheDocument();
    expect(within(getRow('utc-2024-06-30')).getByText('2')).toBeInTheDocument();
    expect(within(getRow('ist-2024-07-01')).getByText('3')).toBeInTheDocument();
  });

  it('3. parses leap-year boundaries without leaving gaps in rendered grid rows', () => {
    const leapBoundaryDates = buildCalendarRange('2024-02-27', '2024-03-01');
    const rows = leapBoundaryDates.map((date, index) => makeRepo(`leap/${date}`, index + 1));

    const { container } = render(<RepoPerformanceTable data={makeData(rows)} />);

    expect(leapBoundaryDates).toEqual(['2024-02-27', '2024-02-28', '2024-02-29', '2024-03-01']);
    for (const date of leapBoundaryDates) {
      expect(screen.getByText(date)).toBeInTheDocument();
    }
    expect(within(container).getAllByRole('row')).toHaveLength(leapBoundaryDates.length + 1);
  });

  it('4. renders locale date-format buckets matching each timezone expectation', () => {
    const timestamp = new Date('2024-12-31T18:45:00.000Z');
    const formattedDates = {
      usUtc: formatCalendarDate(timestamp, 'en-US', 'UTC'),
      gbUtc: formatCalendarDate(timestamp, 'en-GB', 'UTC'),
      jpTokyo: formatCalendarDate(timestamp, 'ja-JP', 'Asia/Tokyo'),
      inKolkata: formatCalendarDate(timestamp, 'en-IN', 'Asia/Kolkata'),
    };

    render(
      <RepoPerformanceTable
        data={makeData([
          makeRepo(`locale/us-${formattedDates.usUtc}`, 1),
          makeRepo(`locale/gb-${formattedDates.gbUtc}`, 1),
          makeRepo(`locale/jp-${formattedDates.jpTokyo}`, 1),
          makeRepo(`locale/in-${formattedDates.inKolkata}`, 1),
        ])}
      />
    );

    expect(formattedDates).toEqual({
      usUtc: '12/31/2024',
      gbUtc: '31/12/2024',
      jpTokyo: '2025/01/01',
      inKolkata: '01/01/2025',
    });
    expect(screen.getByTitle('locale/us-12/31/2024')).toBeInTheDocument();
    expect(screen.getByTitle('locale/gb-31/12/2024')).toBeInTheDocument();
    expect(screen.getByTitle('locale/jp-2025/01/01')).toBeInTheDocument();
    expect(screen.getByTitle('locale/in-01/01/2025')).toBeInTheDocument();
  });

  it('5. keeps daylight-saving transition offsets on the intended visual dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-10T06:30:00.000Z'));

    const dstDates = {
      beforeSpringForward: getVisualDate('2024-03-10T06:59:00.000Z', 'America/New_York'),
      afterSpringForward: getVisualDate('2024-03-10T07:01:00.000Z', 'America/New_York'),
      beforeFallBack: getVisualDate('2024-11-03T05:59:00.000Z', 'America/New_York'),
      afterFallBack: getVisualDate('2024-11-03T06:01:00.000Z', 'America/New_York'),
    };

    render(
      <RepoPerformanceTable
        data={makeData([
          makeRepo(`dst/spring-before-${dstDates.beforeSpringForward}`, 1),
          makeRepo(`dst/spring-after-${dstDates.afterSpringForward}`, 1),
          makeRepo(`dst/fall-before-${dstDates.beforeFallBack}`, 1),
          makeRepo(`dst/fall-after-${dstDates.afterFallBack}`, 1),
        ])}
      />
    );

    expect(dstDates).toEqual({
      beforeSpringForward: '2024-03-10',
      afterSpringForward: '2024-03-10',
      beforeFallBack: '2024-11-03',
      afterFallBack: '2024-11-03',
    });
    expect(screen.getByText('spring-before-2024-03-10')).toBeInTheDocument();
    expect(screen.getByText('spring-after-2024-03-10')).toBeInTheDocument();
    expect(screen.getByText('fall-before-2024-11-03')).toBeInTheDocument();
    expect(screen.getByText('fall-after-2024-11-03')).toBeInTheDocument();
  });
});
