import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';
import { RateLimiter } from '@/lib/rate-limit';

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn().mockResolvedValue(undefined),
}));

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/achievements');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('GET /api/achievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(RateLimiter.prototype, 'check').mockResolvedValue(true);
  });

  it('returns 400 when username is missing', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(400);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    vi.spyOn(RateLimiter.prototype, 'check').mockResolvedValueOnce(false);
    const response = await GET(makeRequest({ username: 'octocat' }));
    expect(response.status).toBe(429);
    expect(getFullDashboardData).not.toHaveBeenCalled();
  });
});
