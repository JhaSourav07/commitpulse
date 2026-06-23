import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({
    success: true,
  }),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn().mockResolvedValue(undefined),
}));

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/compare');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('ApiCompareRoute Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getFullDashboardData).mockResolvedValue({
      profile: { username: 'testuser', name: 'Test User' },
      stats: { totalContributions: 100 },
    } as unknown as Awaited<ReturnType<typeof getFullDashboardData>>);
  });

  it('returns 400 Bad Request when required comparison parameters are missing', async () => {
    const request = makeRequest({ user1: 'octocat' });
    const response = await GET(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid parameters');
  });

  it('returns 200 OK and comparison data when both users are successfully fetched', async () => {
    const request = makeRequest({ user1: 'octocat', user2: 'defunkt' });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.user1.profile.username).toBe('testuser');
    expect(json.user2.profile.username).toBe('testuser');
    expect(getFullDashboardData).toHaveBeenCalledTimes(2);
    expect(getFullDashboardData).toHaveBeenNthCalledWith(
      1,
      'octocat',
      expect.objectContaining({
        token: undefined,
      })
    );
    expect(getFullDashboardData).toHaveBeenNthCalledWith(
      2,
      'defunkt',
      expect.objectContaining({
        token: undefined,
      })
    );
  });

  it('returns 404 Not Found when a user does not exist on GitHub', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(
      new Error('User not found on GitHub', { cause: new Error('could not resolve') })
    );

    const request = makeRequest({ user1: 'invalid-user', user2: 'defunkt' });
    const response = await GET(request);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toContain('was not found');
  });

  it('returns 403 Forbidden when upstream GitHub API rate limits are hit', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(
      new Error('API rate limit exceeded', { cause: new Error('status 403') })
    );

    const request = makeRequest({ user1: 'octocat', user2: 'defunkt' });
    const response = await GET(request);

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toContain('rate limit reached');
  });

  it('returns 500 Internal Server Error when upstream request times out', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(
      new Error('Request timed out', { cause: new Error('timeout') })
    );

    const request = makeRequest({ user1: 'octocat', user2: 'defunkt' });
    const response = await GET(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toContain('Connection timeout');
  });

  it('returns 502 Bad Gateway on unexpected upstream API failures', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('Unexpected network crash'));

    const request = makeRequest({ user1: 'octocat', user2: 'defunkt', token: 'sometoken' });
    const response = await GET(request);

    expect(response.status).toBe(502);
    const json = await response.json();
    expect(json.error).toContain('unexpected error');
  });
});
