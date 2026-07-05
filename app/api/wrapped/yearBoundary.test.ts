import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('../../../lib/github', () => ({
  getWrappedData: vi.fn(),
  fetchGitHubContributions: vi.fn(),
}));

import { getWrappedData, fetchGitHubContributions } from '../../../lib/github';
import type { ContributionCalendar } from '../../../types';
import type { WrappedStats } from '../../../types/dashboard';

const mockCalendar: ContributionCalendar = {
  totalContributions: 1420,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 5, date: '2023-11-19' },
        { contributionCount: 42, date: '2023-11-20' },
        { contributionCount: 12, date: '2023-11-21' },
      ],
    },
  ],
};

const mockWrappedStats: WrappedStats = {
  calendar: mockCalendar,
  totalContributions: 1420,
  mostActiveDate: '2023-11-20',
  highestDailyCount: 42,
  busiestMonth: '2023-11',
  weekendRatio: 24,
  topLanguage: 'TypeScript',
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/wrapped');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('yearBoundary constraints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWrappedData).mockResolvedValue(mockWrappedStats);
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
    } as unknown as import('../../../types').ExtendedContributionData);
  });

  it('Validation (Lower Bound): Returns 400 for a year before GitHub was founded (e.g., 2007)', async () => {
    const response = await GET(makeRequest({ user: 'octocat', year: '2007' }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid parameters');
    expect(body.details.fieldErrors.year[0]).toContain('2008');
    expect(getWrappedData).not.toHaveBeenCalled();
  });

  it('Validation (Upper Bound): Returns 400 for a future year (e.g., 2099)', async () => {
    const response = await GET(makeRequest({ user: 'octocat', year: '2099' }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid parameters');
    expect(body.details.fieldErrors.year[0]).toContain('future');
    expect(getWrappedData).not.toHaveBeenCalled();
  });

  it('Mocking GitHub Responses: Successfully mocks responses for a valid custom year (e.g., 2023) and returns 200', async () => {
    const response = await GET(makeRequest({ user: 'octocat', year: '2023' }));
    expect(response.status).toBe(200);

    expect(getWrappedData).toHaveBeenCalledWith('octocat', '2023', { bypassCache: false });
  });

  it('Computed Stats Metrics: Verifies peak commits and weekend ratio render in the SVG output', async () => {
    const response = await GET(makeRequest({ user: 'octocat', year: '2023' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('42 COMMITS'); // highestDailyCount
    expect(body).toContain('24%'); // weekendRatio
  });

  it('SVG Visual Components: Ensures the SVG renders correctly based on active params', async () => {
    // Testing custom theme (neon) to ensure parameters pass through correctly for the year
    const response = await GET(makeRequest({ user: 'octocat', year: '2023', theme: 'neon' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('2023 WRAPPED');
    // Neon accent color is #ff00ff, which should appear in the SVG
    expect(body).toContain('#ff00ff');
  });
});
