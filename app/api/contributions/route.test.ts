// app/api/contributions/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn().mockResolvedValue(undefined),
}));

import { fetchGitHubContributions } from '@/lib/github';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';

const mockContributionData = {
  totalContributions: 150,
  calendar: {
    totalContributions: 150,
    weeks: [],
  },
  repoContributions: [],
};

function makeRequest(
  params: Record<string, string> = {},
  headers: Record<string, string> = {}
): Request {
  const url = new URL('http://localhost/api/contributions');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString(), {
    headers: new Headers(headers),
  });
}

describe('GET /api/contributions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.TRUSTED_PROXIES = '*';
    quotaMonitor.reset();
    refreshPolicy.reset();
    refreshRateLimiter.reset();
    vi.mocked(fetchGitHubContributions).mockResolvedValue(
      mockContributionData as unknown as Awaited<ReturnType<typeof fetchGitHubContributions>>
    );
  });

  it('returns 400 when username or user parameter is missing', async () => {
    const response = await GET(makeRequest({}, { 'x-forwarded-for': '10.0.0.1' }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Missing required parameter');
    expect(fetchGitHubContributions).not.toHaveBeenCalled();
  });

  it('returns 400 when username is invalid', async () => {
    const response = await GET(
      makeRequest({ username: 'invalid/user' }, { 'x-forwarded-for': '10.0.0.2' })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid GitHub username');
    expect(fetchGitHubContributions).not.toHaveBeenCalled();
  });

  it('returns 200 with contribution data for valid username', async () => {
    const response = await GET(
      makeRequest({ username: 'torvalds' }, { 'x-forwarded-for': '10.0.0.3' })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockContributionData);
    expect(fetchGitHubContributions).toHaveBeenCalledWith('torvalds', expect.anything());
  });

  it('accepts user query parameter as alternative to username', async () => {
    const response = await GET(
      makeRequest({ user: 'torvalds' }, { 'x-forwarded-for': '10.0.0.4' })
    );
    expect(response.status).toBe(200);
    expect(fetchGitHubContributions).toHaveBeenCalledWith('torvalds', expect.anything());
  });

  it('enforces per-IP rate limiting (10 req/min) returning 429 and Retry-After header', async () => {
    const headers = { 'x-forwarded-for': '198.51.100.10' };

    // First 10 requests should succeed
    for (let i = 0; i < 10; i++) {
      const res = await GET(makeRequest({ username: 'torvalds' }, headers));
      expect(res.status).toBe(200);
    }

    // 11th request from same IP should be rate limited
    const limitedRes = await GET(makeRequest({ username: 'torvalds' }, headers));
    expect(limitedRes.status).toBe(429);
    const body = await limitedRes.json();
    expect(body.error).toBe('Too many requests. Please try again later.');
    expect(limitedRes.headers.has('Retry-After')).toBe(true);
    expect(limitedRes.headers.has('X-RateLimit-Limit')).toBe(true);
    expect(limitedRes.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('allows custom token via Authorization header and bypasses shared IP rate limit', async () => {
    const headers = {
      'x-forwarded-for': '198.51.100.20',
      authorization: 'Bearer ghp_customtoken12345',
    };

    const response = await GET(makeRequest({ username: 'torvalds' }, headers));
    expect(response.status).toBe(200);
    expect(fetchGitHubContributions).toHaveBeenCalledWith(
      'torvalds',
      expect.objectContaining({ token: 'ghp_customtoken12345' })
    );
  });

  it('allows custom token via x-github-token header', async () => {
    const headers = {
      'x-forwarded-for': '198.51.100.30',
      'x-github-token': 'ghp_customtoken67890',
    };

    const response = await GET(makeRequest({ username: 'torvalds' }, headers));
    expect(response.status).toBe(200);
    expect(fetchGitHubContributions).toHaveBeenCalledWith(
      'torvalds',
      expect.objectContaining({ token: 'ghp_customtoken67890' })
    );
  });

  it('allows custom token via query parameter', async () => {
    const response = await GET(
      makeRequest(
        { username: 'torvalds', token: 'ghp_querytoken' },
        { 'x-forwarded-for': '198.51.100.40' }
      )
    );
    expect(response.status).toBe(200);
    expect(fetchGitHubContributions).toHaveBeenCalledWith(
      'torvalds',
      expect.objectContaining({ token: 'ghp_querytoken' })
    );
  });

  it('returns 404 when user is not found', async () => {
    const headers = { 'x-forwarded-for': '10.0.0.5' };
    vi.mocked(fetchGitHubContributions).mockRejectedValueOnce(new Error('User not found'));
    const response = await GET(makeRequest({ username: 'nonexistentuser' }, headers));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('User not found');
  });
});
