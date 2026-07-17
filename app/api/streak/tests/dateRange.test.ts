import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Module mocks must be declared before importing the route dynamically
vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  getOrgDashboardData: vi.fn(),
}));

vi.mock('@/utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(),
  getSecondsUntilMidnightInTimezone: vi.fn(),
}));

import { fetchGitHubContributions, getOrgDashboardData } from '@/lib/github';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '@/utils/time';
import { streakParamsSchema } from '@/lib/validations';
import type { ContributionCalendar, ExtendedContributionData } from '@/types';

let GET: (req: NextRequest) => Promise<Response>;

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/streak');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

const baseCalendar: ContributionCalendar = {
  totalContributions: 5,
  weeks: [{ contributionDays: [{ date: '2024-06-10', contributionCount: 1 }] }],
};

describe('GET /api/streak dateRange parameter', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // fixed time helpers for predictable cache-control
    vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(3600);
    vi.mocked(getSecondsUntilMidnightInTimezone).mockReturnValue(7200);

    // Dynamic import so our mocks apply before module evaluation
    const mod = await import('../route');
    GET = mod.GET as (req: NextRequest) => Promise<Response>;

    // Default mock return for contributions
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: baseCalendar,
      repoContributions: [],
    } as unknown as ExtendedContributionData);

    vi.mocked(getOrgDashboardData).mockResolvedValue({
      profile: { username: 'org' },
      stats: {},
      calendar: baseCalendar,
    } as unknown as Awaited<ReturnType<typeof getOrgDashboardData>>);
  });

  it('returns 200 OK and SVG headers for a valid standard dateRange (from/to)', async () => {
    const res = await GET(makeRequest({ user: 'octocat', from: '2024-06-01', to: '2024-06-30' }));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml; charset=utf-8');
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'none'");

    const body = await res.text();
    expect(body).toContain('Current Streak');
  });

  it('applies custom dateRange and affects rendered month labels (body content changes)', async () => {
    // Return a calendar containing a December date so labels should reflect it
    const decCalendar: ContributionCalendar = {
      totalContributions: 2,
      weeks: [{ contributionDays: [{ date: '2024-12-15', contributionCount: 2 }] }],
    };

    vi.mocked(fetchGitHubContributions).mockResolvedValueOnce({
      calendar: decCalendar,
      repoContributions: [],
    } as unknown as ExtendedContributionData);

    const res = await GET(makeRequest({ user: 'octocat', from: '2024-12-01', to: '2024-12-31' }));
    expect(res.status).toBe(200);

    // Ensure the route passed the normalized ISO from/to to the fetch call
    const expectedFrom = new Date('2024-12-01').toISOString();
    const expectedTo = new Date('2024-12-31').toISOString();
    expect(fetchGitHubContributions).toHaveBeenCalledWith(
      'octocat',
      expect.objectContaining({ from: expectedFrom, to: expectedTo })
    );

    const body = await res.text();
    // The custom dateRange returned a smaller calendar; verify that rendered content reflects it
    expect(body).toContain('has 2 total contributions');
  });

  it('omitted dateRange falls back to default parsing and still renders safely', async () => {
    const parsed = streakParamsSchema.safeParse({ user: 'octocat' });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.from).toBeUndefined();

    const res = await GET(makeRequest({ user: 'octocat' }));
    expect(res.status).toBe(200);

    const body = await res.text();
    expect(body).toContain('Current Streak');
  });

  it('invalid dateRange formats return a validation error without crashing', async () => {
    const res = await GET(makeRequest({ user: 'octocat', from: 'not-a-date', to: 'also-not' }));
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain('<svg');
  });

  it('sets sensible Cache-Control and Content-Type headers for SVG output', async () => {
    const res = await GET(makeRequest({ user: 'octocat', from: '2024-06-01', to: '2024-06-30' }));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml; charset=utf-8');
    expect(res.headers.get('Cache-Control')).toBe(
      'public, max-age=60, s-maxage=3600, stale-while-revalidate=59'
    );
  });
});
