import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { fetchUserProfile, fetchGitHubContributions } from '@/lib/github';
import { calculateStreak } from '@/lib/calculate';
import { validateGitHubUsername } from '@/lib/validations';

vi.mock('@/lib/github', () => ({
  fetchUserProfile: vi.fn(),
  fetchGitHubContributions: vi.fn(),
}));

vi.mock('@/lib/calculate', () => ({
  calculateStreak: vi.fn(),
}));

vi.mock('@/lib/validations', () => ({
  validateGitHubUsername: vi.fn(),
}));

function makeRequest(username?: string): Request {
  const url = new URL('http://localhost/api/user-details');

  if (username) {
    url.searchParams.set('username', username);
  }

  return new Request(url.toString());
}

describe('ApiUserDetailsRoute Mouse Interactivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when username parameter is missing', async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toBe('Username is required');
  });

  it('returns 400 when username validation fails', async () => {
    vi.mocked(validateGitHubUsername).mockReturnValue(false);

    const response = await GET(makeRequest('invalid-user'));

    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toBe('Invalid username format');
  });

  it('returns user details and streak stats for valid requests', async () => {
    vi.mocked(validateGitHubUsername).mockReturnValue(true);

    vi.mocked(fetchUserProfile).mockResolvedValue({
      login: 'octocat',
      name: 'The Octocat',
      avatar_url: 'avatar.png',
      public_repos: 8,
    } as never);

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: {},
    } as never);

    vi.mocked(calculateStreak).mockReturnValue({
      currentStreak: 5,
      longestStreak: 10,
      totalContributions: 100,
      todayDate: '2026-06-09',
    });

    const response = await GET(makeRequest('octocat'));

    expect(response.status).toBe(200);

    const json = await response.json();

    expect(json.exists).toBe(true);
    expect(json.login).toBe('octocat');
    expect(json.stats.currentStreak).toBe(5);
  });

  it('returns partial success when contributions fetch has transient failure', async () => {
    vi.mocked(validateGitHubUsername).mockReturnValue(true);

    vi.mocked(fetchUserProfile).mockResolvedValue({
      login: 'octocat',
      name: 'The Octocat',
      avatar_url: 'avatar.png',
      public_repos: 8,
    } as never);

    vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('rate limit exceeded'));

    const response = await GET(makeRequest('octocat'));

    expect(response.status).toBe(200);

    const json = await response.json();

    expect(json.exists).toBe(true);
    expect(json.stats.currentStreak).toBe(0);
    expect(json.stats.longestStreak).toBe(0);
  });

  it('returns 404 when GitHub user is not found', async () => {
    vi.mocked(validateGitHubUsername).mockReturnValue(true);

    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('User not found'));

    const response = await GET(makeRequest('missing-user'));

    expect(response.status).toBe(404);

    const json = await response.json();
    expect(json.error).toBe('User not found');
  });
});
