import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github')>();
  return {
    ...actual,
    getFullDashboardData: vi.fn(),
  };
});

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/rate-limit', () => ({
  RateLimiter: vi.fn().mockImplementation(function () {
    return { check: vi.fn().mockResolvedValue(true) };
  }),
}));

import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';

const makeRequest = (search: string) => new Request(`http://localhost:3000/api/compare?${search}`);

describe('GET /api/compare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFullDashboardData).mockResolvedValue({
      calendar: { totalContributions: 50, weeks: [] },
    } as never);
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it('returns 400 when user1 is missing', async () => {
    const res = await GET(makeRequest('user2=octocat'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when user2 is missing', async () => {
    const res = await GET(makeRequest('user1=octocat'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when both users are missing', async () => {
    const res = await GET(makeRequest(''));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid GitHub username format for user1', async () => {
    const res = await GET(makeRequest('user1=-invalid&user2=octocat'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.details.fieldErrors.user1).toBeDefined();
  });

  it('returns 400 for invalid GitHub username format for user2', async () => {
    const res = await GET(makeRequest('user1=octocat&user2=-invalid'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.details.fieldErrors.user2).toBeDefined();
  });

  it('returns 400 for username exceeding 39 characters', async () => {
    const res = await GET(makeRequest(`user1=${'a'.repeat(40)}&user2=octocat`));
    expect(res.status).toBe(400);
  });

  it('returns 400 when comparing a user with themselves', async () => {
    const res = await GET(makeRequest('user1=octocat&user2=octocat'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.details.fieldErrors.user2).toContain('Cannot compare a user with themselves.');
  });

  it('returns 400 for self-comparison regardless of case', async () => {
    const res = await GET(makeRequest('user1=OctoCat&user2=octocat'));
    expect(res.status).toBe(400);
  });

  // ── Success ──────────────────────────────────────────────────────────────

  it('returns 200 with comparison data for valid users', async () => {
    const res = await GET(makeRequest('user1=alice&user2=bob'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user1).toBeDefined();
    expect(data.user2).toBeDefined();
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it('returns 404 when user1 is not found on GitHub', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('Not found'));
    const res = await GET(makeRequest('user1=ghost123&user2=octocat'));
    expect(res.status).toBe(404);
  });

  it('returns 404 when user2 is not found on GitHub', async () => {
    vi.mocked(getFullDashboardData)
      .mockResolvedValueOnce({ calendar: { totalContributions: 0, weeks: [] } } as never)
      .mockRejectedValueOnce(new Error('Not found'));
    const res = await GET(makeRequest('user1=octocat&user2=ghost123'));
    expect(res.status).toBe(404);
  });

  it('returns 403 when the user1 fetch hits a GitHub rate limit', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('API Rate Limit Exceeded'));

    const res = await GET(makeRequest('user1=octocat&user2=torvalds'));

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('GitHub API rate limit reached. Please try again later.');
  });

  it('returns 403 when the user2 fetch hits a GitHub rate limit', async () => {
    vi.mocked(getFullDashboardData)
      .mockResolvedValueOnce({ calendar: { totalContributions: 0, weeks: [] } } as never)
      .mockRejectedValueOnce(new Error('GitHub GraphQL API returned status 403'));

    const res = await GET(makeRequest('user1=octocat&user2=torvalds'));

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('GitHub API rate limit reached. Please try again later.');
  });

  it('returns 502 for non-rate-limit upstream failures instead of reporting not found', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(
      new Error('GitHub GraphQL API returned status 500')
    );

    const res = await GET(makeRequest('user1=octocat&user2=torvalds'));

    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain('Unable to fetch GitHub data');
  });

  it('returns 404 when the not-found error is wrapped in a cause chain', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(
      new Error('[GitHub API] Failed to fetch profile for user "ghost123"', {
        cause: new Error('User not found'),
      })
    );

    const res = await GET(makeRequest('user1=ghost123&user2=octocat'));

    expect(res.status).toBe(404);
  });

  it('returns 403 when a rate-limit error is wrapped in a cause chain', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(
      new Error('[GitHub API] Failed to fetch profile for user "octocat"', {
        cause: new Error('API Rate Limit Exceeded'),
      })
    );

    const res = await GET(makeRequest('user1=octocat&user2=torvalds'));

    expect(res.status).toBe(403);
  });

  it('returns 504 when a timeout error is wrapped in a cause chain', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(
      new Error('[GitHub API] Failed to fetch profile for user "octocat"', {
        cause: new Error('GitHub API request timed out after 8s'),
      })
    );

    const res = await GET(makeRequest('user1=octocat&user2=torvalds'));

    expect(res.status).toBe(504);
  });

  // ── ETag & Caching ─────────────────────────────────────────────────────────

  it('adds ETag and Cache-Control headers to 200 response', async () => {
    const res = await GET(makeRequest('user1=alice&user2=bob'));
    expect(res.status).toBe(200);
    expect(res.headers.get('ETag')).toBeTruthy();
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=3600');
  });

  it('returns 304 Not Modified when If-None-Match matches weak ETag', async () => {
    const res1 = await GET(makeRequest('user1=alice&user2=bob'));
    const etag = res1.headers.get('ETag');
    expect(etag).toBeTruthy();

    const requestWithEtag = new Request('http://localhost:3000/api/compare?user1=alice&user2=bob', {
      headers: {
        'if-none-match': etag!,
      },
    });

    const res2 = await GET(requestWithEtag);
    expect(res2.status).toBe(304);
    expect(res2.body).toBeNull();
    expect(res2.headers.get('ETag')).toBe(etag);
    expect(res2.headers.get('Cache-Control')).toBe('public, s-maxage=3600');
  });

  it('returns 304 Not Modified when If-None-Match matches strong ETag', async () => {
    const res1 = await GET(makeRequest('user1=alice&user2=bob'));
    const etag = res1.headers.get('ETag');
    expect(etag).toBeTruthy();

    const strongEtag = etag!.replace(/^W\//, '');

    const requestWithEtag = new Request('http://localhost:3000/api/compare?user1=alice&user2=bob', {
      headers: {
        'if-none-match': strongEtag,
      },
    });

    const res2 = await GET(requestWithEtag);
    expect(res2.status).toBe(304);
  });
});
