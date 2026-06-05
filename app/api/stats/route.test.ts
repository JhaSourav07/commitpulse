import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('../../../lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
}));

import { fetchGitHubContributions } from '../../../lib/github';
import type { ContributionCalendar } from '../../../types';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';

// Calendar with a known, predictable streak so assertions are deterministic.
// Last day (2024-06-16) has commits; "today" in tests is set to that date.
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

describe('GET /api/stats', () => {
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

  // ─── Parameter validation ──────────────────────────────────────────────────

  it('returns 400 when the user parameter is missing', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid parameters');
  });

  it('does not call the GitHub API when user is missing', async () => {
    await GET(makeRequest());
    expect(fetchGitHubContributions).not.toHaveBeenCalled();
  });

  it('returns 400 and skips GitHub when the username format is invalid', async () => {
    const response = await GET(makeRequest({ user: 'octo/cat' }));

    expect(response.status).toBe(400);
    expect(fetchGitHubContributions).not.toHaveBeenCalled();
  });

  it('returns 400 for an unknown timezone', async () => {
    const response = await GET(makeRequest({ user: 'testuser', tz: 'Not/ATimezone' }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/Invalid "tz" parameter/);
  });

  // ─── Successful responses ──────────────────────────────────────────────────

  it('returns JSON with the three expected fields', async () => {
    const response = await GET(makeRequest({ user: 'testuser' }));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('totalContributions');
    expect(body).toHaveProperty('longestStreak');
    expect(body).toHaveProperty('currentStreak');
  });

  it('returns Content-Type: application/json', async () => {
    const response = await GET(makeRequest({ user: 'testuser' }));
    expect(response.headers.get('content-type')).toMatch(/application\/json/);
  });

  it('returns correct totalContributions from the calendar', async () => {
    const response = await GET(makeRequest({ user: 'testuser' }));
    const body = await response.json();
    expect(body.totalContributions).toBe(10);
  });

  it('returns numeric values (not strings) for all stat fields', async () => {
    const response = await GET(makeRequest({ user: 'testuser' }));
    const body = await response.json();
    expect(typeof body.totalContributions).toBe('number');
    expect(typeof body.longestStreak).toBe('number');
    expect(typeof body.currentStreak).toBe('number');
  });

  it('returns non-cacheable headers when refresh=true', async () => {
    const response = await GET(makeRequest({ user: 'testuser', refresh: 'true' }));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    expect(response.headers.get('Pragma')).toBe('no-cache');
    expect(response.headers.get('Expires')).toBe('0');
    expect(response.headers.get('X-Refresh-Status')).toBe('Fresh');
  });

  it('still returns valid stats data when refresh=true', async () => {
    const response = await GET(makeRequest({ user: 'testuser', refresh: 'true' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.totalContributions).toBe(10);
    expect(typeof body.longestStreak).toBe('number');
    expect(typeof body.currentStreak).toBe('number');
  });

  it('keeps the existing cache headers for normal requests', async () => {
    const response = await GET(makeRequest({ user: 'testuser' }));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
    expect(response.headers.get('Pragma')).toBeNull();
    expect(response.headers.get('Expires')).toBeNull();
  });

  it('passes bypassCache=true to GitHub when refresh=true', async () => {
    await GET(makeRequest({ user: 'testuser', refresh: 'true' }));
    expect(fetchGitHubContributions).toHaveBeenCalledWith('testuser', { bypassCache: true });
  });

  it('passes bypassCache=false to GitHub when refresh is omitted', async () => {
    await GET(makeRequest({ user: 'testuser' }));
    expect(fetchGitHubContributions).toHaveBeenCalledWith('testuser', { bypassCache: false });
  });

  it('serves cached stats instead of bypassing cache during refresh cooldown', async () => {
    await GET(makeRequest({ user: 'testuser', refresh: 'true' }));

    const response = await GET(makeRequest({ user: 'testuser', refresh: 'true' }));

    expect(response.status).toBe(200);
    expect(fetchGitHubContributions).toHaveBeenLastCalledWith('testuser', {
      bypassCache: false,
    });
    expect(response.headers.get('X-Refresh-Status')).toBe('Cooldown-Served-Cached');
    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
  });

  it('returns 429 when stats refresh exceeds the client refresh rate limit', async () => {
    refreshRateLimiter.setLimit(1);

    await GET(makeRequest({ user: 'testuser', refresh: 'true' }, { 'x-real-ip': '203.0.113.9' }));

    const response = await GET(
      makeRequest({ user: 'octocat', refresh: 'true' }, { 'x-real-ip': '203.0.113.9' })
    );

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toContain('Refresh rate limit exceeded');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('1');
  });

  it('blocks stats refresh when the shared GitHub quota is low', async () => {
    quotaMonitor.setQuota(5000, 400, Date.now() + 60_000);

    const response = await GET(makeRequest({ user: 'testuser', refresh: 'true' }));

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toContain('quota is low');
    expect(fetchGitHubContributions).not.toHaveBeenCalled();
  });

  it('accepts a valid IANA timezone without error', async () => {
    const response = await GET(makeRequest({ user: 'testuser', tz: 'America/New_York' }));
    expect(response.status).toBe(200);
  });

  // ─── Error handling ────────────────────────────────────────────────────────

  it('returns 500 when the GitHub API throws', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('GitHub API error'));
    const response = await GET(makeRequest({ user: 'testuser' }));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('GitHub API error');
  });

  it('returns 404 when GitHub reports that the user does not exist', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValue(
      new Error('GitHub user "missing-user" not found')
    );

    const response = await GET(makeRequest({ user: 'missing-user' }));

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('User not found');
  });

  it('returns 429 when GitHub rate limiting bubbles up from the client', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('API Rate Limit Exceeded'));

    const response = await GET(makeRequest({ user: 'testuser' }));

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe('GitHub API rate limit reached. Please try again later.');
  });

  it('returns 500 with a generic message for non-Error throws', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValue('something went wrong');
    const response = await GET(makeRequest({ user: 'testuser' }));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Unknown error');
  });
});
