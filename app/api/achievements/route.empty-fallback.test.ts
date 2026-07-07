import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';
import { getUserGitHubToken } from '@/lib/githubtoken';

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn(),
}));

const makeRequest = (search = '') =>
  new Request(`http://localhost:3000/api/achievements?${search}`);

const minimalDashboardData = {
  profile: {
    username: 'newbie',
    name: 'New User',
    avatarUrl: '',
    stats: { repositories: 0, followers: 0, following: 0, stars: 0 },
  },
  stats: {
    currentStreak: 0,
    peakStreak: 0,
    totalContributions: 0,
    totalPRs: 0,
    totalIssues: 0,
    totalReviews: 0,
  },
  languages: [],
};

describe('GET /api/achievements - Empty & Missing Input Fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserGitHubToken).mockResolvedValue(undefined);
    vi.mocked(getFullDashboardData).mockResolvedValue(minimalDashboardData as never);
  });

  it('returns 400 when username is an empty string', async () => {
    const res = await GET(makeRequest('username='));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Valid username parameter is required');
  });

  it('returns 400 when username is only whitespace', async () => {
    const res = await GET(makeRequest('username=%20%20%20'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when query string is completely empty', async () => {
    const res = await GET(makeRequest(''));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Valid username parameter is required');
  });

  it('handles missing optional dashboard fields gracefully', async () => {
    const res = await GET(makeRequest('username=newbie'));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.username).toBe('newbie');
    expect(data.overview.unlockedCount).toBe(0);
    expect(data.overview.totalXp).toBe(0);
    expect(data.overview.developerLevel).toBe(1);
    expect(data.categories).toHaveLength(5);
    expect(data.recentUnlocks).toEqual([]);
  });

  it('defaults contributedRepoCount to 0 when graphData is missing', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValue({
      ...minimalDashboardData,
      graphData: undefined,
    } as never);

    const res = await GET(makeRequest('username=newbie'));
    const data = await res.json();

    const repoCategory = data.categories.find(
      (c: { category: string }) => c.category === 'repository'
    );
    const repoExplorer = repoCategory.achievements.find(
      (a: { def: { id: string } }) => a.def.id === 'repository-explorer'
    );

    expect(repoExplorer.state.currentValue).toBe(0);
    expect(repoExplorer.state.unlocked).toBe(false);
  });

  it('defaults totalForks to 0 when popularRepos is missing', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValue({
      ...minimalDashboardData,
      popularRepos: undefined,
    } as never);

    const res = await GET(makeRequest('username=newbie'));
    const data = await res.json();

    const repoCategory = data.categories.find(
      (c: { category: string }) => c.category === 'repository'
    );
    const maintainer = repoCategory.achievements.find(
      (a: { def: { id: string } }) => a.def.id === 'project-maintainer'
    );

    expect(maintainer.state.currentValue).toBe(0);
  });

  it('treats missing forkCount on repos as zero', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValue({
      ...minimalDashboardData,
      popularRepos: [{ name: 'no-forks', description: null, stargazerCount: 0 }],
    } as never);

    const res = await GET(makeRequest('username=newbie'));
    const data = await res.json();

    const repoCategory = data.categories.find(
      (c: { category: string }) => c.category === 'repository'
    );
    const maintainer = repoCategory.achievements.find(
      (a: { def: { id: string } }) => a.def.id === 'project-maintainer'
    );

    expect(maintainer.state.currentValue).toBe(0);
  });

  it('defaults activity to empty array and computes zero active days', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValue({
      ...minimalDashboardData,
      activity: undefined,
    } as never);

    const res = await GET(makeRequest('username=newbie'));
    const data = await res.json();

    const contributionCategory = data.categories.find(
      (c: { category: string }) => c.category === 'contribution'
    );
    const dailyContributor = contributionCategory.achievements.find(
      (a: { def: { id: string } }) => a.def.id === 'daily-contributor'
    );

    expect(dailyContributor.state.currentValue).toBe(0);
    expect(dailyContributor.state.unlocked).toBe(false);
  });

  it('computes weekend contributions only from Saturday and Sunday activity', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValue({
      ...minimalDashboardData,
      activity: [
        { date: '2025-06-07', count: 4 },
        { date: '2025-06-08', count: 6 },
        { date: '2025-06-09', count: 3 },
      ],
    } as never);

    const res = await GET(makeRequest('username=newbie'));
    const data = await res.json();

    const contributionCategory = data.categories.find(
      (c: { category: string }) => c.category === 'contribution'
    );
    const weekendWarrior = contributionCategory.achievements.find(
      (a: { def: { id: string } }) => a.def.id === 'weekend-warrior'
    );

    expect(weekendWarrior.state.currentValue).toBe(10);
  });

  it('works when getUserGitHubToken returns undefined', async () => {
    vi.mocked(getUserGitHubToken).mockResolvedValue(undefined);

    const res = await GET(makeRequest('username=newbie'));
    expect(res.status).toBe(200);
    expect(getFullDashboardData).toHaveBeenCalledWith('newbie', { token: undefined });
  });
});
