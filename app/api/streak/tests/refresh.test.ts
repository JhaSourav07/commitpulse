import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest } from 'node-mocks-http';
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
import { refreshRateLimiter } from '../../../../services/github/refresh-rate-limiter';
import { getSecondsUntilUTCMidnight } from '../../../../utils/time';
import type { ExtendedContributionData } from '../../../../types';

const mockCalendar = {
  totalContributions: 10,
  weeks: [],
};

describe('GET /api/streak - refresh parameter group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refreshRateLimiter.reset();
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
    } as unknown as ExtendedContributionData);
    vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(3600);
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
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
    expect(response.headers.get('X-Cache-Status')).toBe('HIT');
  });

  it('allows a manual refresh within the client refresh limit', async () => {
    refreshRateLimiter.setLimit(1);
    const req = createRequest({
      method: 'GET',
      url: 'http://localhost/api/streak?user=octocat&refresh=true',
      headers: { 'x-real-ip': '203.0.113.7' },
    });

    const response = await GET(req as unknown as Request);

    expect(response.status).toBe(200);
    expect(fetchGitHubContributions).toHaveBeenCalledWith(
      'octocat',
      expect.objectContaining({ bypassCache: true })
    );
    expect(response.headers.get('X-Cache-Status')).toMatch(/^BYPASS/);
  });

  it('returns a rate-limit SVG and skips GitHub fetching when manual refresh exceeds the client limit', async () => {
    refreshRateLimiter.setLimit(1);

    await GET(
      createRequest({
        method: 'GET',
        url: 'http://localhost/api/streak?user=octocat&refresh=true',
        headers: { 'x-real-ip': '203.0.113.8' },
      }) as unknown as Request
    );
    vi.mocked(fetchGitHubContributions).mockClear();

    const response = await GET(
      createRequest({
        method: 'GET',
        url: 'http://localhost/api/streak?user=octocat&refresh=true',
        headers: { 'x-real-ip': '203.0.113.8' },
      }) as unknown as Request
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('Content-Type')).toContain('image/svg+xml');
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(await response.text()).toContain('<svg');
    expect(fetchGitHubContributions).not.toHaveBeenCalled();
  });

  it('returns a JSON 429 and skips GitHub fetching when JSON manual refresh exceeds the client limit', async () => {
    refreshRateLimiter.setLimit(1);

    await GET(
      createRequest({
        method: 'GET',
        url: 'http://localhost/api/streak?user=octocat&refresh=true&format=json',
        headers: { 'x-real-ip': '203.0.113.9' },
      }) as unknown as Request
    );
    vi.mocked(fetchGitHubContributions).mockClear();

    const response = await GET(
      createRequest({
        method: 'GET',
        url: 'http://localhost/api/streak?user=octocat&refresh=true&format=json',
        headers: { 'x-real-ip': '203.0.113.9' },
      }) as unknown as Request
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('1');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    await expect(response.json()).resolves.toEqual({
      error: 'Refresh rate limit exceeded. Please try again later.',
    });
    expect(fetchGitHubContributions).not.toHaveBeenCalled();
  });

  it('does not consume the manual refresh limit for non-refresh requests', async () => {
    refreshRateLimiter.setLimit(1);

    const first = await GET(
      createRequest({
        method: 'GET',
        url: 'http://localhost/api/streak?user=octocat',
        headers: { 'x-real-ip': '203.0.113.10' },
      }) as unknown as Request
    );
    const second = await GET(
      createRequest({
        method: 'GET',
        url: 'http://localhost/api/streak?user=octocat',
        headers: { 'x-real-ip': '203.0.113.10' },
      }) as unknown as Request
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(fetchGitHubContributions).toHaveBeenCalledTimes(2);
    expect(fetchGitHubContributions).toHaveBeenLastCalledWith(
      'octocat',
      expect.objectContaining({ bypassCache: false })
    );
  });
});
