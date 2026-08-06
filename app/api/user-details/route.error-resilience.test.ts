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

describe('GET /api/user-details: exception safety & error fallbacks (additional resilience cases)', () => {
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

  it('propagates a "not found" contributions failure to a 404, even though the profile fetch succeeded', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValue(
      new Error('GitHub user "testuser" not found')
    );

    const response = await GET(makeRequest({ username: 'testuser' }));

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('User not found');
  });

  it('treats a non-Error rejection from the contributions fetch as transient and falls back to default stats', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValue({ code: 'ECONNRESET' });

    const response = await GET(makeRequest({ username: 'testuser' }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.exists).toBe(true);
    expect(body.login).toBe(mockProfile.login);
    expect(body.stats).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      totalContributions: 0,
    });
  });

  it('returns 404 when the profile error message contains "404" without the literal phrase "not found"', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('GitHub REST API error: 404'));

    const response = await GET(makeRequest({ username: 'testuser' }));

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('User not found');
  });

  it('does not crash and resolves a single classified error when both profile and contributions fail simultaneously', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('GitHub user "testuser" not found'));
    vi.mocked(fetchGitHubContributions).mockRejectedValue(
      new Error('GitHub API request timed out after 5s')
    );

    await expect(GET(makeRequest({ username: 'testuser' }))).resolves.toBeDefined();

    const response = await GET(makeRequest({ username: 'testuser' }));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('User not found');
  });

  it('documents a case-sensitivity gap: a differently-cased "Not Found" contributions error is not classified as 404', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValue(
      new Error('GitHub user "testuser" Not Found')
    );

    const response = await GET(makeRequest({ username: 'testuser' }));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Internal server error');
  });
});
