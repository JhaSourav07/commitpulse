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
    {
      contributionDays: [
        { contributionCount: 0, date: '2024-06-17' },
        { contributionCount: 0, date: '2024-06-18' },
        { contributionCount: 0, date: '2024-06-19' },
        { contributionCount: 0, date: '2024-06-20' },
        { contributionCount: 0, date: '2024-06-21' },
        { contributionCount: 0, date: '2024-06-22' },
        { contributionCount: 0, date: '2024-06-23' },
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

describe('Streak API - layout parameter integration tests', () => {
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

  it('should return 200 OK and render default layout when layout parameter is default', async () => {
    const response = await GET(makeRequest({ user: 'octocat', layout: 'default' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
  });

  it('should return 200 OK and render compact layout when layout parameter is compact', async () => {
    const response = await GET(makeRequest({ user: 'octocat', layout: 'compact' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
  });

  it('should return 200 OK and render full layout when layout parameter is full', async () => {
    const response = await GET(makeRequest({ user: 'octocat', layout: 'full' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
  });

  it('should return 400 Bad Request when layout parameter is invalid', async () => {
    const response = await GET(makeRequest({ user: 'octocat', layout: 'unsupported_layout_type' }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid parameters');
    expect(body.details.fieldErrors.layout[0]).toContain('Invalid layout format');
  });

  it('should fall back to default layout when layout is empty', async () => {
    const response = await GET(makeRequest({ user: 'octocat', layout: '' }));
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('<svg');
  });
});
