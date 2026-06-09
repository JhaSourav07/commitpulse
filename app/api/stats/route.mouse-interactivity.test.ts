import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';
import { fetchGitHubContributions } from '@/lib/github';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';
import type { ContributionCalendar, ExtendedContributionData } from '@/types';

vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
}));

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

describe('ApiStatsRoute Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quotaMonitor.reset();
    refreshPolicy.reset();
    refreshRateLimiter.reset();

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
      isOfflineFallback: false,
    } as unknown as ExtendedContributionData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 Bad Request when required user parameter is missing or invalid', async () => {
    const request = makeRequest({});
    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid parameters');
  });

  it('returns 400 Bad Request when timezone tz parameter is invalid', async () => {
    const request = makeRequest({ user: 'octocat', tz: 'Invalid/Timezone' });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('Invalid "tz" parameter');
  });

  it('returns 429 when refresh is requested and quota monitor is low', async () => {
    // Force quota to be low
    vi.spyOn(quotaMonitor, 'isQuotaLow').mockReturnValue(true);

    const request = makeRequest({ user: 'octocat', refresh: 'true' });
    const response = await GET(request);

    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.error).toContain('GitHub API quota is low');
  });

  it('returns 429 when refresh is requested and rate limit check fails', async () => {
    vi.spyOn(refreshRateLimiter, 'checkLimit').mockReturnValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 99999,
    });

    const request = makeRequest({ user: 'octocat', refresh: 'true' });
    const response = await GET(request);

    expect(response.status).toBe(429);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('serves cached data and returns Cooldown-Served-Cached header if refresh is requested during cooldown window', async () => {
    // Force refresh policy to deny refresh
    vi.spyOn(refreshPolicy, 'isRefreshAllowed').mockReturnValue(false);

    const request = makeRequest({ user: 'octocat', refresh: 'true' });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Refresh-Status')).toBe('Cooldown-Served-Cached');
    // Verify fetch is called without cache bypass (bypassCache: false)
    expect(fetchGitHubContributions).toHaveBeenCalledWith('octocat', { bypassCache: false });
  });

  it('successfully retrieves user stats and returns Fresh status if refresh is allowed', async () => {
    const request = makeRequest({ user: 'octocat', refresh: 'true' });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Refresh-Status')).toBe('Fresh');
    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');

    const json = await response.json();
    expect(json.totalContributions).toBe(15);
    expect(json.longestStreak).toBe(2);
    expect(json.currentStreak).toBe(2);
  });
});
