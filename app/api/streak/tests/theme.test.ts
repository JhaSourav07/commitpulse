/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { fetchGitHubContributions, getOrgDashboardData } from '../../../../lib/github';
import {
  getSecondsUntilUTCMidnight,
  getSecondsUntilMidnightInTimezone,
} from '../../../../utils/time';
import type { ContributionCalendar, ExtendedContributionData } from '../../../../types';

vi.mock('../../../../lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  getOrgDashboardData: vi.fn(),
}));

vi.mock('../../../../utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(),
  getSecondsUntilMidnightInTimezone: vi.fn(),
}));

const mockCalendar: ContributionCalendar = {
  totalContributions: 10,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 1, date: '2024-06-10' },
        { contributionCount: 2, date: '2024-06-11' },
        { contributionCount: 0, date: '2024-06-12' },
        { contributionCount: 3, date: '2024-06-13' },
        { contributionCount: 1, date: '2024-06-14' },
        { contributionCount: 0, date: '2024-06-15' },
        { contributionCount: 3, date: '2024-06-16' },
      ],
    },
  ],
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/streak');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('Streak API - theme parameter integration tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
    } as unknown as ExtendedContributionData);
    vi.mocked(getOrgDashboardData).mockResolvedValue({
      profile: {},
      stats: {},
      calendar: mockCalendar,
    } as any);
    vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(3600);
    vi.mocked(getSecondsUntilMidnightInTimezone).mockReturnValue(7200);
  });

  it('should return 200 OK and render dark theme by default', async () => {
    const response = await GET(makeRequest({ user: 'octocat', theme: 'dark' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
  });

  it('should return 200 OK and render light theme when theme is light', async () => {
    const response = await GET(makeRequest({ user: 'octocat', theme: 'light' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
  });

  it('should return 200 OK when theme is auto', async () => {
    const response = await GET(makeRequest({ user: 'octocat', theme: 'auto' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
  });

  it('should return 200 OK when theme is random', async () => {
    const response = await GET(makeRequest({ user: 'octocat', theme: 'random' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
  });

  it('should return 400 Bad Request when theme parameter is invalid', async () => {
    const response = await GET(makeRequest({ user: 'octocat', theme: 'not-a-valid-theme' }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid parameters');
    expect(body.details.fieldErrors.theme[0]).toContain('Invalid theme');
  });

  it('should produce different SVGs when theme is dark vs light', async () => {
    const resDark = await GET(makeRequest({ user: 'octocat', theme: 'dark' }));
    const resLight = await GET(makeRequest({ user: 'octocat', theme: 'light' }));

    expect(resDark.status).toBe(200);
    expect(resLight.status).toBe(200);

    const svgDark = await resDark.text();
    const svgLight = await resLight.text();

    expect(svgDark).not.toEqual(svgLight);
  });
});
