import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';
import { getUserGitHubToken } from '@/lib/githubtoken';
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

const mockDashboardData = {
  profile: {
    username: 'octocat',
    name: 'The Octocat',
    avatarUrl: 'https://example.com/avatar.png',
    stats: { repositories: 10, followers: 20, following: 5, stars: 100 },
  },
  stats: {
    currentStreak: 5,
    peakStreak: 15,
    totalContributions: 500,
    totalPRs: 10,
    totalIssues: 5,
    totalReviews: 3,
  },
  languages: [
    { name: 'TypeScript', percentage: 60, color: '#3178c6' },
    { name: 'Python', percentage: 40, color: '#3572A5' },
  ],
  activity: [
    { date: '2025-06-07', count: 5 },
    { date: '2025-06-08', count: 3 },
    { date: '2025-06-14', count: 2 },
  ],
  graphData: {
    nodes: [
      { type: 'Contribution', id: 'repo-1' },
      { type: 'Contribution', id: 'repo-2' },
      { type: 'Repository', id: 'repo-3' },
    ],
    links: [],
  },
  popularRepos: [
    {
      name: 'ml-toolkit',
      description: 'machine-learning utilities',
      stargazerCount: 30,
      forkCount: 5,
    },
    {
      name: 'demo-app',
      description: 'A demo project',
      stargazerCount: 10,
      forkCount: 2,
    },
  ],
};

describe('GET /api/achievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(RateLimiter.prototype, 'check').mockResolvedValue(true);
    vi.mocked(getUserGitHubToken).mockResolvedValue('mock-token');
    vi.mocked(getFullDashboardData).mockResolvedValue(mockDashboardData as never);
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it('returns 400 when username is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Valid username parameter is required');
  });

  it('returns 400 for invalid GitHub username format', async () => {
    const res = await GET(makeRequest({ username: '-invalid' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Valid username parameter is required');
  });

  it('returns 400 for username exceeding 39 characters', async () => {
    const res = await GET(makeRequest({ username: 'a'.repeat(40) }));
    expect(res.status).toBe(400);
  });

  it('does not call GitHub APIs when username is invalid', async () => {
    await GET(makeRequest({ username: '' }));
    expect(getUserGitHubToken).not.toHaveBeenCalled();
    expect(getFullDashboardData).not.toHaveBeenCalled();
  });

  // ── Success ──────────────────────────────────────────────────────────────

  it('returns 200 with achievements response for a valid username', async () => {
    const res = await GET(makeRequest({ username: 'octocat' }));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.username).toBe('octocat');
    expect(data.profile).toEqual({
      avatarUrl: 'https://example.com/avatar.png',
      name: 'The Octocat',
      login: 'octocat',
    });
    expect(data.overview).toBeDefined();
    expect(data.categories).toHaveLength(5);
    expect(data.recentUnlocks).toBeDefined();
  });

  it('passes the user GitHub token to getFullDashboardData', async () => {
    await GET(makeRequest({ username: 'octocat' }));
    expect(getUserGitHubToken).toHaveBeenCalled();
    expect(getFullDashboardData).toHaveBeenCalledWith('octocat', { token: 'mock-token' });
  });

  it('computes overview stats from dashboard data', async () => {
    const res = await GET(makeRequest({ username: 'octocat' }));
    const data = await res.json();

    expect(data.overview.totalAchievements).toBe(24);
    expect(data.overview.unlockedCount).toBeGreaterThan(0);
    expect(data.overview.totalXp).toBeGreaterThan(0);
    expect(data.overview.developerLevel).toBeGreaterThanOrEqual(1);
    expect(data.overview.completionPercent).toBe(
      Math.round((data.overview.unlockedCount / 24) * 100)
    );
  });

  it('unlocks silver commit-champion tier at 500 contributions', async () => {
    const res = await GET(makeRequest({ username: 'octocat' }));
    const data = await res.json();

    const contributionCategory = data.categories.find(
      (c: { category: string }) => c.category === 'contribution'
    );
    const commitChampion = contributionCategory.achievements.find(
      (a: { def: { id: string } }) => a.def.id === 'commit-champion'
    );

    expect(commitChampion.state.unlocked).toBe(true);
    expect(commitChampion.state.currentTier).toBe('silver');
    expect(commitChampion.state.currentValue).toBe(500);
    expect(commitChampion.state.xpEarned).toBe(150);
  });

  it('groups achievements into all five categories', async () => {
    const res = await GET(makeRequest({ username: 'octocat' }));
    const data = await res.json();

    const categoryIds = data.categories.map((c: { category: string }) => c.category);
    expect(categoryIds).toEqual([
      'contribution',
      'pull-request',
      'repository',
      'collaboration',
      'technology',
    ]);

    for (const category of data.categories) {
      expect(category.totalCount).toBe(category.achievements.length);
      expect(category.unlockedCount).toBeLessThanOrEqual(category.totalCount);
      expect(category.label).toBe(
        category.category.charAt(0).toUpperCase() + category.category.slice(1)
      );
    }
  });

  it('detects AI repos from name and description keywords', async () => {
    const res = await GET(makeRequest({ username: 'octocat' }));
    const data = await res.json();

    const techCategory = data.categories.find(
      (c: { category: string }) => c.category === 'technology'
    );
    const aiExplorer = techCategory.achievements.find(
      (a: { def: { id: string } }) => a.def.id === 'ai-explorer'
    );

    expect(aiExplorer.state.currentValue).toBe(1);
    expect(aiExplorer.state.unlocked).toBe(true);
  });

  it('returns recentUnlocks sorted by xpEarned descending', async () => {
    const res = await GET(makeRequest({ username: 'octocat' }));
    const data = await res.json();

    expect(data.recentUnlocks.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < data.recentUnlocks.length; i++) {
      expect(data.recentUnlocks[i - 1].state.xpEarned).toBeGreaterThanOrEqual(
        data.recentUnlocks[i].state.xpEarned
      );
    }
  });

  it('sets nextAchievement to the first locked achievement', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValue({
      ...mockDashboardData,
      stats: {
        currentStreak: 0,
        peakStreak: 0,
        totalContributions: 0,
        totalPRs: 0,
        totalIssues: 0,
        totalReviews: 0,
      },
      activity: [],
      languages: [],
      popularRepos: [],
      graphData: { nodes: [], links: [] },
      profile: {
        ...mockDashboardData.profile,
        stats: { repositories: 0, followers: 0, following: 0, stars: 0 },
      },
    } as never);

    const res = await GET(makeRequest({ username: 'newbie' }));
    const data = await res.json();

    expect(data.overview.unlockedCount).toBe(0);
    expect(data.nextAchievement).not.toBeNull();
    expect(data.nextAchievement.state.unlocked).toBe(false);
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  it('returns 404 when user is not found on GitHub', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('User not found'));
    const res = await GET(makeRequest({ username: 'ghost123' }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('User not found');
  });

  it('returns 404 when error message contains "could not resolve"', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(
      new Error('Could not resolve to a User with the login of "ghost123"')
    );
    const res = await GET(makeRequest({ username: 'ghost123' }));
    expect(res.status).toBe(404);
  });

  it('returns 429 when GitHub rate limit is reached', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('API rate limit exceeded'));
    const res = await GET(makeRequest({ username: 'octocat' }));
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe('GitHub API rate limit reached. Please try again later.');
  });

  it('returns 429 when error message contains "API limit reached"', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('API limit reached'));
    const res = await GET(makeRequest({ username: 'octocat' }));
    expect(res.status).toBe(429);
  });

  it('returns 500 for unexpected errors', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('Database connection failed'));
    const res = await GET(makeRequest({ username: 'octocat' }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Database connection failed');
  });

  it('returns 500 with "Unknown error" for non-Error thrown values', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce('unexpected failure');
    const res = await GET(makeRequest({ username: 'octocat' }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Unknown error');
  });

  it('returns 429 when rate limit is exceeded', async () => {
    vi.spyOn(RateLimiter.prototype, 'check').mockResolvedValueOnce(false);
    const response = await GET(makeRequest({ username: 'octocat' }));
    expect(response.status).toBe(429);
    expect(getFullDashboardData).not.toHaveBeenCalled();
  });
});
