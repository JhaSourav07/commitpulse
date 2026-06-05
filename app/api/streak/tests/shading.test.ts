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

// Provide contribution calendar with non-zero values to ensure tower intensity is > 0
const mockCalendar: ContributionCalendar = {
  totalContributions: 10,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 1, date: '2024-06-10' },
        { contributionCount: 2, date: '2024-06-11' },
        { contributionCount: 4, date: '2024-06-12' },
        { contributionCount: 3, date: '2024-06-13' },
        { contributionCount: 1, date: '2024-06-14' },
        { contributionCount: 2, date: '2024-06-15' },
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

describe('Streak API - shading parameter integration tests', () => {
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

  it('should return 200 OK and apply shading when shading is true', async () => {
    const response = await GET(makeRequest({ user: 'octocat', shading: 'true' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
  });

  it('should return 200 OK and not apply shading when shading is false', async () => {
    const response = await GET(makeRequest({ user: 'octocat', shading: 'false' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
  });

  it('should fallback to false and return 200 OK when shading is invalid', async () => {
    const response = await GET(makeRequest({ user: 'octocat', shading: 'invalid_value' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
  });

  it('should default to false and return 200 OK when shading is missing', async () => {
    const response = await GET(makeRequest({ user: 'octocat' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
  });

  it('should produce different SVGs when shading is true vs false', async () => {
    const resShadingOn = await GET(makeRequest({ user: 'octocat', shading: 'true' }));
    const resShadingOff = await GET(makeRequest({ user: 'octocat', shading: 'false' }));

    expect(resShadingOn.status).toBe(200);
    expect(resShadingOff.status).toBe(200);

    const svgOn = await resShadingOn.text();
    const svgOff = await resShadingOff.text();

    expect(svgOn).not.toEqual(svgOff);
  });
});
