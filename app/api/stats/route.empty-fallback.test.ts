import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import type { ContributionCalendar } from '../../../types';

vi.mock('../../../lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
}));

import { fetchGitHubContributions } from '../../../lib/github';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';

function makeRequest(
  params: Record<string, string> = {},
  headers: Record<string, string> = {}
): Request {
  const url = new URL('http://localhost/api/stats');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString(), {
    headers: new Headers(headers),
  });
}

describe('GET /api/stats - Edge Cases & Empty/Missing Inputs Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quotaMonitor.reset();
    refreshPolicy.reset();
    refreshRateLimiter.reset();
  });

  it('handles an empty weeks array without crashing and returns zero stats', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: {
        totalContributions: 0,
        weeks: [],
      },
      repoContributions: [],
    });

    const response = await GET(makeRequest({ user: 'testuser' }));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      totalContributions: 0,
      longestStreak: 0,
      currentStreak: 0,
    });
  });

  it('handles a week with an empty contributionDays array', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: {
        totalContributions: 0,
        weeks: [{ contributionDays: [] }],
      },
      repoContributions: [],
    });

    const response = await GET(makeRequest({ user: 'testuser' }));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      totalContributions: 0,
      longestStreak: 0,
      currentStreak: 0,
    });
  });

  it('handles a completely null calendar object gracefully', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: null as unknown as ContributionCalendar,
      repoContributions: [],
    });

    const response = await GET(makeRequest({ user: 'testuser' }));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      totalContributions: 0,
      longestStreak: 0,
      currentStreak: 0,
    });
  });

  it('handles an undefined weeks array within calendar', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: {
        totalContributions: 0,
        weeks: undefined as unknown as ContributionCalendar['weeks'],
      },
      repoContributions: [],
    });

    const response = await GET(makeRequest({ user: 'testuser' }));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      totalContributions: 0,
      longestStreak: 0,
      currentStreak: 0,
    });
  });

  it('maintains expected JSON structure and returns zero stats for completely empty data with tz parameter', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: {
        totalContributions: 0,
        weeks: [
          {
            contributionDays: [{ date: '', contributionCount: 0 }],
          },
        ],
      },
      repoContributions: [],
    });

    const response = await GET(makeRequest({ user: 'testuser', tz: 'America/New_York' }));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      totalContributions: 0,
      longestStreak: 0,
      currentStreak: 0,
    });
  });
});
