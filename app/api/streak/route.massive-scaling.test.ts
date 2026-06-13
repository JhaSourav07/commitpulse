import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { fetchGitHubContributions } from '@/lib/github';
import type { ExtendedContributionData } from '@/types';

vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  getOrgDashboardData: vi.fn(),
}));

vi.mock('@/utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(() => 3600),
  getSecondsUntilMidnightInTimezone: vi.fn(() => 7200),
}));

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/streak');

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new Request(url.toString());
}

function createMassiveCalendar() {
  const weeks = Array.from({ length: 750 }, (_, weekIndex) => ({
    contributionDays: Array.from({ length: 7 }, (_, dayIndex) => ({
      contributionCount: (weekIndex + dayIndex) % 500,
      date: `2024-${String((dayIndex % 12) + 1).padStart(2, '0')}-${String(
        (weekIndex % 28) + 1
      ).padStart(2, '0')}`,
    })),
  }));

  return {
    totalContributions: weeks.reduce(
      (sum, week) =>
        sum + week.contributionDays.reduce((inner, day) => inner + day.contributionCount, 0),
      0
    ),
    weeks,
  };
}

describe('ApiStreakRoute massive scaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: createMassiveCalendar(),
      repoContributions: [],
      isOfflineFallback: false,
    } as unknown as ExtendedContributionData);
  });

  it('returns JSON successfully for extremely large contribution calendars', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
        format: 'json',
      })
    );

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.user).toBe('octocat');
    expect(body.calendar.weeks.length).toBe(750);
  });

  it('generates SVG successfully from extremely large datasets', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
      })
    );

    expect(response.status).toBe(200);

    const svg = await response.text();

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('supports days filtering on large calendars without truncating data', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
        format: 'json',
        days: '365',
      })
    );

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.calendar.weeks.length).toBeGreaterThan(0);

    const totalRenderedDays = body.calendar.weeks.reduce(
      (sum: number, week: { contributionDays: unknown[] }) => sum + week.contributionDays.length,
      0
    );

    expect(totalRenderedDays).toBeGreaterThan(300);
    expect(totalRenderedDays).toBeLessThanOrEqual(365);
  });

  it('maintains acceptable processing performance for large JSON payloads', async () => {
    const start = performance.now();

    const response = await GET(
      makeRequest({
        user: 'octocat',
        format: 'json',
      })
    );

    expect(response.status).toBe(200);

    await response.json();

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10000);
  });

  it('produces stable cache and ETag headers for large datasets', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
        format: 'json',
      })
    );

    expect(response.status).toBe(200);

    expect(response.headers.get('ETag')).toBeTruthy();

    expect(response.headers.get('Cache-Control')).toContain('s-maxage');

    expect(response.headers.get('X-Cache-Status')).toBeTruthy();
  });
});
