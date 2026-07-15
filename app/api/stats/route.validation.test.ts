import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  contributionsCache: { has: vi.fn().mockResolvedValue(true) },
  cacheKey: vi.fn().mockReturnValue('key'),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn().mockResolvedValue(undefined),
}));

import { fetchGitHubContributions } from '@/lib/github';
import type { ContributionCalendar } from '@/types';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';

const mockCalendar: ContributionCalendar = {
  totalContributions: 15,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 5, date: '2024-06-10' },
        { contributionCount: 10, date: '2024-06-11' },
      ],
    },
  ],
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/stats');

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return new Request(url.toString(), {
    headers: new Headers({
      'x-forwarded-for': '127.0.0.1',
    }),
  });
}

describe('GET /api/stats additional runtime coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    quotaMonitor.reset();
    refreshPolicy.reset();
    refreshRateLimiter.reset();

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
    });
  });

  it('treats bypassCache=true as a refresh request', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
        bypassCache: 'true',
      })
    );

    expect(response.status).toBe(200);

    expect(fetchGitHubContributions).toHaveBeenCalledWith('octocat', {
      bypassCache: true,
    });

    expect(response.headers.get('X-Refresh-Status')).toBe('Fresh');
    expect(response.headers.get('X-Cache-Status')).toBe('MISS');
  });

  it('returns cache HIT status for normal requests', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
      })
    );

    expect(response.status).toBe(200);

    expect(response.headers.get('X-Cache-Status')).toBe('HIT');
    expect(response.headers.get('X-Refresh-Status')).toBe('Cached');
  });

  it('returns no-store cache headers when bypassCache=true', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
        bypassCache: 'true',
      })
    );

    expect(response.status).toBe(200);

    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    expect(response.headers.get('Pragma')).toBe('no-cache');
    expect(response.headers.get('Expires')).toBe('0');
  });

  it('returns standard cache headers for normal requests', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
      })
    );

    expect(response.status).toBe(200);

    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=1, stale-while-revalidate=59'
    );
    expect(response.headers.get('Pragma')).toBeNull();
    expect(response.headers.get('Expires')).toBeNull();
  });

  it('records refresh requests through bypassCache=true', async () => {
    await GET(
      makeRequest({
        user: 'octocat',
        bypassCache: 'true',
      })
    );

    const response = await GET(
      makeRequest({
        user: 'octocat',
        bypassCache: 'true',
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Refresh-Status')).toBe('Cooldown-Served-Cached');

    expect(fetchGitHubContributions).toHaveBeenLastCalledWith('octocat', {
      bypassCache: false,
    });
  });
});
