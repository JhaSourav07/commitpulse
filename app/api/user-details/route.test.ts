import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/github', () => ({
  fetchUserProfile: vi.fn(),
  fetchGitHubContributions: vi.fn(),
}));

import { fetchUserProfile, fetchGitHubContributions } from '@/lib/github';
import type { ContributionCalendar } from '@/types';

const mockCalendar: ContributionCalendar = {
  totalContributions: 15,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 5, date: '2024-06-10' },
        { contributionCount: 5, date: '2024-06-11' },
        { contributionCount: 5, date: '2024-06-12' },
      ],
    },
  ],
};

const mockProfile = {
  login: 'testuser',
  name: 'Test User',
  avatar_url: 'https://github.com/testuser.png',
  public_repos: 12,
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/user-details');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('GET /api/user-details', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(fetchUserProfile).mockResolvedValue(mockProfile as any);
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
      totalPRs: 0,
      totalIssues: 0,
    });
  });

  it('returns 400 when username is missing', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Username is required');
  });

  it('returns 400 when username format is invalid', async () => {
    const response = await GET(makeRequest({ username: 'invalid_user_name_@' }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid username format');
  });

  it('returns 200 with user details and streak stats on success', async () => {
    const response = await GET(makeRequest({ username: 'testuser' }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      exists: true,
      login: 'testuser',
      name: 'Test User',
      avatar_url: 'https://github.com/testuser.png',
      public_repos: 12,
      stats: {
        currentStreak: 3,
        longestStreak: 3,
        totalContributions: 15,
      },
    });
  });

  it('returns 404 when user is not found', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('User not found'));
    const response = await GET(makeRequest({ username: 'missinguser' }));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('User not found');
  });

  it('gracefully handles contributions fetch failure and returns profile details', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('API limit reached'));
    const response = await GET(makeRequest({ username: 'testuser' }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.stats).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      totalContributions: 0,
    });
  });
  it('returns 429 when rate limit is exceeded', async () => {
    const { RateLimiter } = await import('@/lib/rate-limit');
    vi.spyOn(RateLimiter.prototype, 'checkWithResult').mockResolvedValueOnce({
      success: false,
      limit: 20,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const response = await GET(makeRequest({ username: 'testuser' }));
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe('Too many requests. Please try again later.');
  });

  it('returns 500 with generic error message for unexpected errors', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('Database connection failed'));
    const response = await GET(makeRequest({ username: 'testuser' }));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Internal server error');
    expect(body.error).not.toContain('Database');
  });

  it('returns 500 with generic error message for non-Error thrown values', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue('unexpected failure');
    const response = await GET(makeRequest({ username: 'testuser' }));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Internal server error');
  });
});
