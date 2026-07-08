import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest } from 'node-mocks-http';
import { GET } from '../route';

vi.mock('../../../../lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../lib/github')>();
  return {
    ...actual,
    fetchGitHubContributions: vi.fn(),
    getOrgDashboardData: vi.fn(),
    getCircuitTelemetry: vi.fn().mockReturnValue({ isOpen: false, resetInMs: 0 }),
  };
});

vi.mock('../../../../utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(),
  getSecondsUntilMidnightInTimezone: vi.fn(),
}));

import { fetchGitHubContributions, getCircuitTelemetry } from '../../../../lib/github';
import { getSecondsUntilUTCMidnight } from '../../../../utils/time';
import type { ExtendedContributionData } from '../../../../types';
import { refreshPolicy } from '../../../../services/github/refresh-policy';
import { refreshRateLimiter } from '../../../../services/github/refresh-rate-limiter';
import { quotaMonitor } from '../../../../services/github/quota-monitor';

const mockCalendar = {
  totalContributions: 10,
  weeks: [],
};

describe('GET /api/streak - refresh parameter group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refreshPolicy.reset();
    refreshRateLimiter.reset();
    quotaMonitor.reset();
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
    } as unknown as ExtendedContributionData);
    vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(3600);
    vi.mocked(getCircuitTelemetry).mockReturnValue({ isOpen: false, resetInMs: 0 });
  });

  it('returns status 200 for valid requests with custom refresh values', async () => {
    const req = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat&refresh=true',
    });
    const response = await GET(req as unknown as Request);
    expect(response.status).toBe(200);
  });

  it('correctly reflects changes dictated by the parameter by forwarding bypassCache to the fetcher', async () => {
    const req = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat&refresh=true',
    });
    await GET(req as unknown as Request);
    expect(fetchGitHubContributions).toHaveBeenCalledWith(
      'octocat',
      expect.objectContaining({ bypassCache: true })
    );
  });

  it('tests negative and fallback edge cases for invalid inputs of refresh', async () => {
    const invalidInputs = ['false', '1', 'yes', 'random', ''];

    for (const val of invalidInputs) {
      vi.clearAllMocks();
      const req = createRequest({
        method: 'GET',
        url: `http://localhost/api/streak?user=octocat&refresh=${val}`,
      });
      const response = await GET(req as unknown as Request);

      expect(response.status).toBe(200);
      expect(fetchGitHubContributions).toHaveBeenCalledWith(
        'octocat',
        expect.objectContaining({ bypassCache: false })
      );
      expect(response.headers.get('X-Cache-Status')).toBe('HIT');
    }
  });

  it('asserts that appropriate HTTP headers are returned in responses (cache bypass)', async () => {
    const req = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat&refresh=true',
    });
    const response = await GET(req as unknown as Request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(response.headers.get('X-Cache-Status')).toMatch(/^BYPASS/);
  });

  it('asserts that appropriate HTTP headers are returned in responses (normal cache fallback)', async () => {
    const req = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat',
    });
    const response = await GET(req as unknown as Request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=60, s-maxage=3600, stale-while-revalidate=60'
    );
    expect(response.headers.get('X-Cache-Status')).toBe('HIT');
  });

  it('returns rate limit status when GitHub API quota is low', async () => {
    quotaMonitor.setQuota(5000, 400, Date.now() + 60000); // 8% remaining
    const req = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat&refresh=true',
    });
    const response = await GET(req as unknown as Request);
    expect(response.status).toBe(429);
    const text = await response.text();
    expect(text).toContain('rate limit'); // rate limit SVG
  });

  it('returns rate limit status when IP refresh limit is exceeded', async () => {
    refreshRateLimiter.setLimit(1, 60000); // 1 refresh allowed per window
    const req1 = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat&refresh=true',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    const res1 = await GET(req1 as unknown as Request);
    expect(res1.status).toBe(200);

    const req2 = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat&refresh=true',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    const res2 = await GET(req2 as unknown as Request);
    expect(res2.status).toBe(429);
  });

  it('falls back to cached data when per-username cooldown is active', async () => {
    const req1 = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat&refresh=true',
    });
    const res1 = await GET(req1 as unknown as Request);
    expect(res1.status).toBe(200);
    expect(res1.headers.get('X-Cache-Status')).toMatch(/^BYPASS/);

    const req2 = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat&refresh=true',
    });
    const res2 = await GET(req2 as unknown as Request);
    expect(res2.status).toBe(200);
    expect(res2.headers.get('X-Cache-Status')).toBe('HIT');
  });

  it('returns JSON error response when JSON format is requested and rate limit is hit', async () => {
    quotaMonitor.setQuota(5000, 400, Date.now() + 60000); // 8% remaining
    const req = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat&refresh=true&format=json',
    });
    const response = await GET(req as unknown as Request);
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toContain('quota is low');
  });
});
