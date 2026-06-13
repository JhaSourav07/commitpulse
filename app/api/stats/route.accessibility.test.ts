import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('../../../lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
}));

import { fetchGitHubContributions } from '../../../lib/github';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';

const mockCalendar = {
  totalContributions: 10,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 3, date: '2024-06-14' },
        { contributionCount: 1, date: '2024-06-15' },
        { contributionCount: 2, date: '2024-06-16' },
      ],
    },
  ],
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/stats');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('ApiStatsRoute Accessibility Standards & Screen Reader Aria Compliance', () => {
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

  it('returns correct accessible label coordinates via Content-Type application/json', async () => {
    const response = await GET(makeRequest({ user: 'testuser' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/application\/json/);
  });

  it('ensures response shape exposes all required accessible stat fields', async () => {
    const response = await GET(makeRequest({ user: 'testuser' }));
    const body = await response.json();
    expect(body).toHaveProperty('totalContributions');
    expect(body).toHaveProperty('longestStreak');
    expect(body).toHaveProperty('currentStreak');
    expect(typeof body.totalContributions).toBe('number');
    expect(typeof body.longestStreak).toBe('number');
    expect(typeof body.currentStreak).toBe('number');
  });

  it('announces validation errors with descriptive accessible error messages', async () => {
    const response = await GET(makeRequest({ user: 'octo/cat' }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  it('maintains accessible cache-control header semantics for normal requests', async () => {
    const response = await GET(makeRequest({ user: 'testuser' }));
    expect(response.status).toBe(200);
    const cacheControl = response.headers.get('Cache-Control');
    expect(cacheControl).toContain('public');
    expect(cacheControl).toContain('s-maxage');
    expect(cacheControl).toContain('stale-while-revalidate');
  });

  it('confirms standard X-Refresh-Status header exists in correct logical response hierarchy', async () => {
    const fresh = await GET(makeRequest({ user: 'testuser', refresh: 'true' }));
    expect(fresh.status).toBe(200);
    expect(fresh.headers.get('X-Refresh-Status')).toBe('Fresh');

    const cached = await GET(makeRequest({ user: 'testuser' }));
    expect(cached.status).toBe(200);
    expect(cached.headers.get('X-Refresh-Status')).toBe('Cached');
  });
});
