import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('../../../../lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  getOrgDashboardData: vi.fn(),
}));

vi.mock('../../../../utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(),
  getSecondsUntilMidnightInTimezone: vi.fn(),
}));

import { fetchGitHubContributions } from '../../../../lib/github';
import {
  getSecondsUntilUTCMidnight,
  getSecondsUntilMidnightInTimezone,
} from '../../../../utils/time';
import type { ContributionCalendar, ExtendedContributionData } from '../../../../types';

const mockCalendar: ContributionCalendar = {
  totalContributions: 10,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 2, date: '2024-06-10' },
        { contributionCount: 1, date: '2024-06-11' },
        { contributionCount: 3, date: '2024-06-12' },
        { contributionCount: 0, date: '2024-06-13' },
        { contributionCount: 2, date: '2024-06-14' },
        { contributionCount: 1, date: '2024-06-15' },
        { contributionCount: 1, date: '2024-06-16' },
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

describe('Streak API — tz parameter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
    } as unknown as ExtendedContributionData);
    vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(3600);
    vi.mocked(getSecondsUntilMidnightInTimezone).mockReturnValue(7200);
  });

  describe('invalid timezone', () => {
    it('returns 400 for a completely invalid timezone string', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'Not/ATimezone' }));
      expect(response.status).toBe(400);
    });

    it('returns a JSON error body with fieldErrors for an invalid timezone', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'Not/ATimezone' }));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid parameters');
      expect(body.details.fieldErrors.tz).toBeDefined();
      expect(body.details.fieldErrors.tz[0]).toContain('Invalid timezone');
    });

    it('does not call the GitHub API when the timezone is invalid', async () => {
      await GET(makeRequest({ user: 'octocat', tz: 'Bad_Timezone' }));
      expect(fetchGitHubContributions).not.toHaveBeenCalled();
    });

    it('returns 400 for a timezone that is clearly garbage', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'foo/bar/baz' }));
      expect(response.status).toBe(400);
    });

    it('sets Cache-Control: no-store on the error response', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'Not/ATimezone' }));
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });
  });

  describe('valid timezone', () => {
    it('returns 200 with SVG for a valid IANA timezone', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'America/New_York' }));
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain('<svg');
    });

    it('returns 200 for Asia/Kolkata', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'Asia/Kolkata' }));
      expect(response.status).toBe(200);
    });

    it('returns 200 for UTC', async () => {
      const response = await GET(makeRequest({ user: 'octocat', tz: 'UTC' }));
      expect(response.status).toBe(200);
    });

    it('uses getSecondsUntilMidnightInTimezone when a valid tz is provided', async () => {
      await GET(makeRequest({ user: 'octocat', tz: 'America/New_York' }));
      expect(getSecondsUntilMidnightInTimezone).toHaveBeenCalled();
      expect(getSecondsUntilUTCMidnight).not.toHaveBeenCalled();
    });
  });

  describe('omitted timezone', () => {
    it('returns 200 when no tz param is provided', async () => {
      const response = await GET(makeRequest({ user: 'octocat' }));
      expect(response.status).toBe(200);
    });

    it('uses getSecondsUntilUTCMidnight when tz is omitted', async () => {
      await GET(makeRequest({ user: 'octocat' }));
      expect(getSecondsUntilUTCMidnight).toHaveBeenCalled();
      expect(getSecondsUntilMidnightInTimezone).not.toHaveBeenCalled();
    });
  });
});
