import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest } from 'node-mocks-http';
import { GET } from '../route';
import { getWrappedData, fetchGitHubContributions } from '@/lib/github';

vi.mock('@/lib/github', () => ({
  getWrappedData: vi.fn(),
  fetchGitHubContributions: vi.fn(),
}));

describe('GET /api/wrapped validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getWrappedData).mockResolvedValue({
      totalContributions: 1500,
      daysActive: 300,
      longestStreak: 45,
      weekendCommits: 200,
      busiestMonth: '2023-10',
      topRepositories: [{ name: 'commitpulse', count: 100 }],
      mostActiveDay: { date: '2023-10-15', contributionCount: 50 },
      streakStats: {
        currentStreak: 10,
        longestStreak: 45,
        totalContributions: 1500,
        todayDate: '2023-12-31',
      },
    } as unknown as import('@/types/dashboard').WrappedStats);

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: { totalContributions: 1500, weeks: [] },
      repoContributions: [],
    } as unknown as import('@/types').ExtendedContributionData);
  });

  const makeMockRequest = (params: Record<string, string> = {}) => {
    const url = new URL('http://localhost/api/wrapped');
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return createRequest({
      method: 'GET',
      url: url.toString(),
    }) as unknown as Request;
  };

  it('TestCase 1: returns 400 for missing user parameter (Zod validation)', async () => {
    const req = makeMockRequest({});
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid parameters');
  });

  it('TestCase 2: verifies invalid theme settings fallback to dark instead of 400', async () => {
    const req = makeMockRequest({ user: 'octocat', theme: 'invalid_theme_name_123' });
    const res = await GET(req);

    // The wrapped endpoint's zod schema transforms invalid themes to 'dark' gracefully.
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('<svg');
    // Verify it falls back to the dark theme background
    expect(text).toContain('0d1117');
  });

  it('TestCase 3: mocks GitHub responses for custom year bounds and verifies year params', async () => {
    const req = makeMockRequest({ user: 'octocat', year: '2023' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(getWrappedData).toHaveBeenCalledWith('octocat', '2023', { bypassCache: false });
    expect(fetchGitHubContributions).toHaveBeenCalledWith('octocat', {
      from: '2023-01-01T00:00:00Z',
      to: '2023-12-31T23:59:59Z',
      bypassCache: false,
    });
  });

  it('TestCase 4: verifies computed stats metrics like streak peak and weekend commits in SVG output', async () => {
    // Setup mock to return specific metrics that will be rendered into the SVG
    vi.mocked(getWrappedData).mockResolvedValue({
      totalContributions: 5000,
      daysActive: 365,
      longestStreak: 45, // Streak peak
      weekendCommits: 200, // Weekend commits
      busiestMonth: '2023-10',
      topRepositories: [{ name: 'commitpulse', count: 100 }],
      mostActiveDay: { date: '2023-10-15', contributionCount: 50 },
      streakStats: {
        currentStreak: 10,
        longestStreak: 45,
        totalContributions: 5000,
        todayDate: '2023-12-31',
      },
    } as unknown as import('@/types/dashboard').WrappedStats);

    const req = makeMockRequest({ user: 'octocat' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const text = await res.text();

    expect(text).toContain('<svg');
    // The generator should output the peak streak and weekend commits somewhere in the SVG.
    expect(text).toContain('45');
    expect(text).toContain('200');
  });

  it('TestCase 5: ensures SVG visual components render correctly based on active params', async () => {
    const req = makeMockRequest({ user: 'octocat', bg: 'ff0000', radius: '20' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const text = await res.text();

    expect(text).toContain('<svg');
    // Ensure the background color and radius are passed properly and rendered in the SVG
    expect(text).toContain('ff0000');
    expect(text).toContain('20');
  });
});
