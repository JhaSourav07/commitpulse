/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchGitHubContributions,
  fetchUserProfile,
  fetchUserRepos,
  getFullDashboardData,
  generateAchievements,
  clearGitHubApiCacheForTests,
  GITHUB_CACHE_TTL_MS,
  validateGitHubUsername,
  cacheKey,
  buildCommitClock,
} from './github';
import type { ContributionCalendar } from '../types';

const mockCalendar: ContributionCalendar = {
  totalContributions: 42,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 3, date: '2024-06-10' },
        { contributionCount: 0, date: '2024-06-11' },
        { contributionCount: 5, date: '2024-06-12' },
      ],
    },
  ],
};

const originalGitHubPat = process.env.GITHUB_PAT;
const originalGitHubToken = process.env.GITHUB_TOKEN;

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  clearGitHubApiCacheForTests();
  process.env.GITHUB_PAT = 'test-token';
  delete process.env.GITHUB_TOKEN;
});

afterEach(() => {
  clearGitHubApiCacheForTests();
  if (originalGitHubPat === undefined) {
    delete process.env.GITHUB_PAT;
  } else {
    process.env.GITHUB_PAT = originalGitHubPat;
  }

  if (originalGitHubToken === undefined) {
    delete process.env.GITHUB_TOKEN;
  } else {
    process.env.GITHUB_TOKEN = originalGitHubToken;
  }
});

describe('fetchGitHubContributions', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the contribution calendar on a successful response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: mockCalendar } },
        },
      })
    );

    const result = await fetchGitHubContributions('octocat');

    expect(result).toEqual(mockCalendar);
  });

  it('sends a POST request to the GitHub GraphQL endpoint with the correct body', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: mockCalendar } },
        },
      })
    );

    await fetchGitHubContributions('octocat');

    expect(fetch).toHaveBeenCalledOnce();

    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://api.github.com/graphql');
    expect(options?.method).toBe('POST');
    expect(options?.headers).toMatchObject({
      Authorization: 'bearer test-token',
      'Content-Type': 'application/json',
    });

    // Make sure the username is wired into the GraphQL variables, not hardcoded.
    const body = JSON.parse(options?.body as string);
    expect(body.variables).toEqual({ login: 'octocat' });
    expect(body.query).toContain('contributionCalendar');
  });

  it('uses GITHUB_TOKEN when GITHUB_PAT is not configured', async () => {
    delete process.env.GITHUB_PAT;
    process.env.GITHUB_TOKEN = 'actions-token';
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: mockCalendar } },
        },
      })
    );

    await fetchGitHubContributions('octocat');

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(options?.headers).toMatchObject({
      Authorization: 'bearer actions-token',
    });
  });

  it('throws before fetching when no GitHub token is configured', async () => {
    delete process.env.GITHUB_PAT;
    delete process.env.GITHUB_TOKEN;

    await expect(fetchGitHubContributions('octocat')).rejects.toThrow(
      'GitHub token is missing. Set GITHUB_PAT or GITHUB_TOKEN.'
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('works correctly for a brand-new user who has zero contribution weeks', async () => {
    const emptyCalendar: ContributionCalendar = { totalContributions: 0, weeks: [] };

    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: emptyCalendar } },
        },
      })
    );

    const result = await fetchGitHubContributions('new-user');

    expect(result).toEqual(emptyCalendar);
  });

  it('throws with the status code when the server returns 500', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ message: 'Internal Server Error' }, 500));

    await expect(fetchGitHubContributions('octocat')).rejects.toThrow(
      'GitHub GraphQL API returned status 500 after 3 retries'
    );
  });

  it('throws with the status code when the server returns 401 (expired or missing token)', async () => {
    // A 401 is the most common real-world failure — bad or missing GITHUB_PAT.
    vi.mocked(fetch).mockResolvedValue(mockResponse({ message: 'Unauthorized' }, 401));

    await expect(fetchGitHubContributions('octocat')).rejects.toThrow(
      'GitHub PAT is invalid or missing'
    );
  });

  it('throws when fetch itself rejects due to a network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Failed to fetch'));

    await expect(fetchGitHubContributions('octocat')).rejects.toThrow('Failed to fetch');
  });

  it('throws the first GraphQL error when the API returns an errors array', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: { user: null },
        errors: [{ message: 'Bad credentials' }, { message: 'Some other error' }],
      })
    );

    // Preserve the existing behavior of surfacing the first GitHub error message.
    await expect(fetchGitHubContributions('octocat')).rejects.toThrow('Bad credentials');
  });

  it('throws a stable fallback when GraphQL returns an empty errors array', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        errors: [],
      })
    );

    await expect(fetchGitHubContributions('octocat')).rejects.toThrow(
      'GitHub GraphQL API returned an unknown error'
    );
  });

  it('throws a stable fallback when the first GraphQL error has no message', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        errors: [{}],
      })
    );

    await expect(fetchGitHubContributions('octocat')).rejects.toThrow(
      'GitHub GraphQL API returned an unknown error'
    );
  });

  it('throws a descriptive "user not found" error when the username does not exist on GitHub', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ data: { user: null } }));

    await expect(fetchGitHubContributions('ghost-user-xyz')).rejects.toThrow(
      'GitHub user "ghost-user-xyz" not found'
    );
  });
  it('handles calendar with all days having zero contributions', async () => {
    const sparseCalendar: ContributionCalendar = {
      totalContributions: 0,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 0, date: '2024-01-01' },
            { contributionCount: 0, date: '2024-01-02' },
          ],
        },
      ],
    };
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: sparseCalendar } },
        },
      })
    );
    const result = await fetchGitHubContributions('sparse-user');
    expect(result.totalContributions).toBe(0);
    expect(result.weeks).toHaveLength(1);
  });

  it('is deterministic: two calls with empty-year response return identical data', async () => {
    const emptyCalendar: ContributionCalendar = { totalContributions: 0, weeks: [] };

    vi.mocked(fetch).mockImplementation(async () =>
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: emptyCalendar } },
        },
      })
    );

    const r1 = await fetchGitHubContributions('empty-user', { bypassCache: true });
    const r2 = await fetchGitHubContributions('empty-user', { bypassCache: true });
    expect(r1).toEqual(r2);
  });
});

describe('fetchUserProfile', () => {
  beforeEach(() => vi.spyOn(global, 'fetch'));
  afterEach(() => vi.restoreAllMocks());

  it('returns profile data on success', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ login: 'octocat', name: 'The Octocat' }));
    const result = await fetchUserProfile('octocat');
    expect(result.name).toBe('The Octocat');
  });

  it('throws "User not found" on 404', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ message: 'Not Found' }, 404));
    await expect(fetchUserProfile('ghost')).rejects.toThrow('User not found');
  });

  it('throws status code error on other failures', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ message: 'Error' }, 500));
    await expect(fetchUserProfile('octocat')).rejects.toThrow('GitHub REST API error: 500');
  });
});

describe('fetchUserRepos', () => {
  beforeEach(() => vi.spyOn(global, 'fetch'));
  afterEach(() => vi.restoreAllMocks());

  it('returns repos data on success', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse([{ stargazers_count: 1, language: 'TypeScript' }])
    );
    const result = await fetchUserRepos('octocat');
    expect(result[0].stargazers_count).toBe(1);
  });

  it('throws status code error on failure', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ message: 'Error' }, 500));
    await expect(fetchUserRepos('octocat')).rejects.toThrow('GitHub REST API error: 500');
  });

  it('fetches multiple pages of repos', async () => {
    vi.mocked(fetch).mockImplementation(async (url: RequestInfo | URL) => {
      const urlStr = typeof url === 'string' ? url : url ? url.toString() : '';
      if (urlStr.includes('page=1&')) {
        return mockResponse(
          Array.from({ length: 100 }, (_, i) => ({
            id: i,
            stargazers_count: i,
            language: 'TypeScript',
          }))
        );
      }
      if (urlStr.includes('page=2&')) {
        return mockResponse([
          {
            id: 101,
            stargazers_count: 101,
            language: 'JavaScript',
          },
        ]);
      }
      return mockResponse([]);
    });

    const result = await fetchUserRepos('octocat', { bypassCache: true });

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(result.length).toBe(101);
  });

  it('stops fetching after reaching max pages', async () => {
    vi.mocked(fetch).mockImplementation(
      () =>
        Promise.resolve(
          mockResponse(
            Array.from({ length: 100 }, (_, i) => ({
              id: i,
              stargazers_count: i,
              language: 'TypeScript',
            }))
          )
        ) as Promise<Response>
    );

    await fetchUserRepos('octocat', { bypassCache: true });

    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('handles concurrent pagination behavior and maintains stable response ordering', async () => {
    vi.mocked(fetch).mockImplementation(async (url: RequestInfo | URL) => {
      const urlStr = typeof url === 'string' ? url : url ? url.toString() : '';
      if (urlStr.includes('page=1&')) {
        return mockResponse(
          Array.from({ length: 100 }, (_, i) => ({
            name: `repo-page1-${i}`,
            stargazers_count: i,
            language: 'TypeScript',
          }))
        );
      }
      if (urlStr.includes('page=2&')) {
        return mockResponse(
          Array.from({ length: 100 }, (_, i) => ({
            name: `repo-page2-${i}`,
            stargazers_count: 101,
            language: 'JavaScript',
          }))
        );
      }
      if (urlStr.includes('page=3&')) {
        return mockResponse([
          {
            name: 'repo-page3-1',
            stargazers_count: 102,
            language: 'Rust',
          },
        ]);
      }
      return mockResponse([]);
    });

    const result = await fetchUserRepos('octocat', { bypassCache: true });

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(result.length).toBe(201);

    // Verify ordering is perfectly preserved: Page 1, then Page 2, then Page 3
    expect((result[0] as any).name).toBe('repo-page1-0');
    expect((result[99] as any).name).toBe('repo-page1-99');
    expect((result[100] as any).name).toBe('repo-page2-0');
    expect((result[199] as any).name).toBe('repo-page2-99');
    expect((result[200] as any).name).toBe('repo-page3-1');
  });
});

describe('getFullDashboardData', () => {
  beforeEach(() => vi.spyOn(global, 'fetch'));
  afterEach(() => vi.restoreAllMocks());

  it('returns full dashboard data correctly', async () => {
    vi.mocked(fetch).mockImplementation(async (url: RequestInfo | URL) => {
      if (typeof url === 'string' && url.includes('/users/octocat/repos')) {
        return mockResponse([
          { stargazers_count: 10, language: 'TypeScript' },
          { stargazers_count: 5, language: 'TypeScript' },
          { stargazers_count: 20, language: 'Rust' },
        ]);
      }
      if (typeof url === 'string' && url.includes('/users/octocat')) {
        return mockResponse({
          login: 'octocat',
          name: 'The Octocat',
          avatar_url: 'avatar.png',
          public_repos: 3,
          followers: 10,
          following: 5,
          created_at: '2020-01-01T00:00:00Z',
          bio: 'Hello world',
          location: 'Earth',
        });
      }
      // GraphQL
      return mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: mockCalendar } },
        },
      });
    });

    const result = await getFullDashboardData('octocat');

    expect(result.profile.username).toBe('octocat');
    expect(result.profile.stats.stars).toBe(35);
    expect(result.languages).toEqual([
      { name: 'TypeScript', percentage: 67, color: '#3178c6' },
      { name: 'Rust', percentage: 33, color: '#dea584' },
    ]);
    expect(result.insights).toBeDefined();
    expect(result.commitClock).toBeDefined();
    expect(result.commitClock).toHaveLength(7);
    expect(result.commitClock[0]).toHaveProperty('day');
    expect(result.commitClock[0]).toHaveProperty('commits');
    // Verify determinism: same input always produces the same output
    const totalClockCommits = result.commitClock.reduce(
      (sum: number, d: { commits: number }) => sum + d.commits,
      0
    );
    expect(totalClockCommits).toBe(8); // 3 + 0 + 5 from mockCalendar
  });

  it('maps contribution counts to correct intensity levels', async () => {
    const intensityCalendar: ContributionCalendar = {
      totalContributions: 30,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 0, date: '2024-06-10' },
            { contributionCount: 2, date: '2024-06-11' },
            { contributionCount: 5, date: '2024-06-12' },
            { contributionCount: 8, date: '2024-06-13' },
            { contributionCount: 15, date: '2024-06-14' },
          ],
        },
      ],
    };

    vi.mocked(fetch).mockImplementation(async (url: RequestInfo | URL) => {
      if (typeof url === 'string' && url.includes('/users/octocat/repos')) {
        return mockResponse([]);
      }

      if (typeof url === 'string' && url.includes('/users/octocat')) {
        return mockResponse({
          login: 'octocat',
          name: 'The Octocat',
          avatar_url: 'avatar.png',
          public_repos: 0,
          followers: 0,
          following: 0,
          created_at: '2020-01-01T00:00:00Z',
        });
      }

      return mockResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: intensityCalendar,
            },
          },
        },
      });
    });

    const result = await getFullDashboardData('octocat');

    const activities = result.activity;

    expect(activities[0].intensity).toBe(0);
    expect(activities[1].intensity).toBe(1);
    expect(activities[2].intensity).toBe(2);
    expect(activities[3].intensity).toBe(3);
    expect(activities[4].intensity).toBe(4);
  });

  it('throws if profile fetch fails', async () => {
    vi.mocked(fetch).mockImplementation(async (url: RequestInfo | URL) => {
      if (typeof url === 'string' && url.includes('/users/octocat/repos')) {
        return mockResponse([]);
      }
      if (typeof url === 'string' && url.includes('/users/octocat')) {
        throw new Error('Network error');
      }
      return mockResponse({
        data: { user: { contributionsCollection: { contributionCalendar: mockCalendar } } },
      });
    });
    await expect(getFullDashboardData('octocat')).rejects.toThrow(
      '[GitHub API] Failed to fetch profile for user "octocat"'
    );
  });

  it('throws correctly for non-error throws in profile fetch', async () => {
    vi.mocked(fetch).mockImplementation(async (url: RequestInfo | URL) => {
      if (typeof url === 'string' && url.includes('/users/octocat/repos')) {
        return mockResponse([]);
      }
      if (typeof url === 'string' && url.includes('/users/octocat')) {
        throw 'String error';
      }
      return mockResponse({
        data: { user: { contributionsCollection: { contributionCalendar: mockCalendar } } },
      });
    });
    await expect(getFullDashboardData('octocat')).rejects.toThrow(
      '[GitHub API] Failed to fetch profile for user "octocat"'
    );
  });

  it('formats joinedDate as MMM YYYY', async () => {
    // Verifies that created_at from the REST API is formatted with toLocaleDateString('en-US')
    // into a stable 'Jan 2020' shape regardless of the runtime environment's system locale.
    vi.mocked(fetch).mockImplementation(async (url: RequestInfo | URL) => {
      if (typeof url === 'string' && url.includes('/users/testuser/repos')) {
        return mockResponse([]);
      }
      if (typeof url === 'string' && url.includes('/users/testuser')) {
        return mockResponse({
          login: 'testuser',
          name: 'Test User',
          avatar_url: 'https://example.com/avatar.png',
          bio: null,
          location: null,
          public_repos: 0,
          followers: 0,
          following: 0,
          created_at: '2020-01-15T00:00:00Z',
        });
      }
      return mockResponse({
        data: { user: { contributionsCollection: { contributionCalendar: mockCalendar } } },
      });
    });

    const result = await getFullDashboardData('testuser');

    // 'en-US' locale with { month: 'short', year: 'numeric' } always produces 'Jan 2020'
    expect(result.profile.joinedDate).toMatch(/^[A-Za-z]+ \d{4}$/);
  });

  it('maps calculateStreak output correctly to stats', async () => {
    // Verifies that getFullDashboardData correctly pipes the contribution calendar
    // through calculateStreak and maps the result onto the returned stats object.
    vi.mocked(fetch).mockImplementation(async (url: RequestInfo | URL) => {
      if (typeof url === 'string' && url.includes('/users/testuser/repos')) {
        return mockResponse([]);
      }
      if (typeof url === 'string' && url.includes('/users/testuser')) {
        return mockResponse({
          login: 'testuser',
          name: 'Test User',
          avatar_url: 'https://example.com/avatar.png',
          bio: null,
          location: null,
          public_repos: 0,
          followers: 0,
          following: 0,
          created_at: '2020-01-15T00:00:00Z',
        });
      }
      return mockResponse({
        data: { user: { contributionsCollection: { contributionCalendar: mockCalendar } } },
      });
    });

    const result = await getFullDashboardData('testuser');

    // totalContributions must be passed through unchanged from the calendar
    expect(result.stats.totalContributions).toBe(mockCalendar.totalContributions);
    // streak values are non-negative by definition
    expect(result.stats.currentStreak).toBeGreaterThanOrEqual(0);
    // peak (longestStreak) can never be less than the current streak
    expect(result.stats.peakStreak).toBeGreaterThanOrEqual(result.stats.currentStreak);
  });
});

describe('GitHub API cache behavior', () => {
  beforeEach(() => {
    clearGitHubApiCacheForTests();
    vi.spyOn(global, 'fetch');
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    clearGitHubApiCacheForTests();
  });

  it('cache hit: second contributions call uses cached value', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: mockCalendar } },
        },
      })
    );

    await fetchGitHubContributions('octocat');
    await fetchGitHubContributions('octocat');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('refresh bypass: bypassCache=true forces a fresh fetch', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: mockCalendar } },
        },
      })
    );

    await fetchGitHubContributions('octocat');
    await fetchGitHubContributions('octocat', { bypassCache: true });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('cache expiry: expired entry triggers a new fetch', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    vi.mocked(fetch).mockImplementation(async () =>
      mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: mockCalendar } },
        },
      })
    );

    await fetchGitHubContributions('octocat');

    vi.setSystemTime(Date.now() + GITHUB_CACHE_TTL_MS + 1);
    await fetchGitHubContributions('octocat');

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('cache hit: second profile call uses cached value', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        login: 'octocat',
        name: 'The Octocat',
      })
    );

    await fetchUserProfile('octocat');
    await fetchUserProfile('octocat');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('refresh bypass: bypassCache=true forces fresh profile fetch', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      mockResponse({
        login: 'octocat',
        name: 'The Octocat',
      })
    );

    await fetchUserProfile('octocat');
    await fetchUserProfile('octocat', { bypassCache: true });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('cache hit: second repos call uses cached value', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse([
        {
          stargazers_count: 1,
          language: 'TypeScript',
        },
      ])
    );

    await fetchUserRepos('octocat');
    await fetchUserRepos('octocat');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('refresh bypass: bypassCache=true forces fresh repos fetch', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      mockResponse([
        {
          stargazers_count: 1,
          language: 'TypeScript',
        },
      ])
    );

    await fetchUserRepos('octocat');
    await fetchUserRepos('octocat', { bypassCache: true });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('handles a new account with no public repos correctly', async () => {
    vi.mocked(fetch).mockImplementation(async (url: RequestInfo | URL) => {
      if (typeof url === 'string' && url.includes('/users/octocat/repos')) {
        return mockResponse([]);
      }
      if (typeof url === 'string' && url.includes('/users/octocat')) {
        return mockResponse({
          login: 'octocat',
          name: 'The Octocat',
          avatar_url: 'avatar.png',
          public_repos: 0,
          followers: 0,
          following: 0,
          created_at: '2024-01-01T00:00:00Z',
          bio: null,
          location: null,
        });
      }
      return mockResponse({
        data: {
          user: { contributionsCollection: { contributionCalendar: mockCalendar } },
        },
      });
    });

    const result = await getFullDashboardData('octocat');

    expect(result.languages).toEqual([]);
    expect(result.profile.stats.stars).toBe(0);
    expect(result.profile.developerScore).toBeGreaterThanOrEqual(0);
  });
});
describe('generateAchievements', () => {
  it('marks contribution milestones correctly', () => {
    const achievements = generateAchievements(600, 10);

    const unlocked = achievements.filter((a) => a.isUnlocked);

    expect(unlocked.some((a) => a.title === '500 Contributions')).toBe(true);

    expect(unlocked.some((a) => a.title === '1000 Contributions')).toBe(false);
  });

  it('unlocks all achievements for max contribution and streak values', () => {
    const achievements = generateAchievements(1001, 101);

    expect(achievements.every((achievement) => achievement.isUnlocked === true)).toBe(true);
  });

  it('marks streak milestones correctly', () => {
    const achievements = generateAchievements(50, 35);

    const unlocked = achievements.filter((a) => a.isUnlocked);

    expect(unlocked.some((a) => a.title === '30 Day Streak')).toBe(true);

    expect(unlocked.some((a) => a.title === '100 Day Streak')).toBe(false);
  });

  it('caps progress between 0 and 100 for extreme values', () => {
    const achievements = generateAchievements(999999, 999999);

    for (const item of achievements) {
      expect(Number.isFinite(item.progress)).toBe(true);
      expect(item.progress).toBeGreaterThanOrEqual(0);
      expect(item.progress).toBeLessThanOrEqual(100);
    }
  });
});

describe('validateGitHubUsername', () => {
  it('returns true for a valid username', () => {
    expect(validateGitHubUsername('valid-username-123')).toBe(true);
  });

  it('returns false for a too long username', () => {
    expect(validateGitHubUsername('a'.repeat(40))).toBe(false);
  });

  it('returns false for a username with underscore', () => {
    expect(validateGitHubUsername('invalid_username')).toBe(false);
  });

  it('returns false for a username with spaces', () => {
    expect(validateGitHubUsername('invalid username')).toBe(false);
  });

  it('returns false for a leading hyphen', () => {
    expect(validateGitHubUsername('-invalid')).toBe(false);
  });

  it('returns false for a trailing hyphen', () => {
    expect(validateGitHubUsername('invalid-')).toBe(false);
  });

  it('returns false for consecutive hyphens', () => {
    expect(validateGitHubUsername('in--valid')).toBe(false);
  });
});

describe('cacheKey', () => {
  it('creates key without year', () => {
    expect(cacheKey('profile', 'DeepSikha')).toBe('profile:deepsikha');
  });

  it('creates key with year', () => {
    expect(cacheKey('contributions', 'DeepSikha', '2025')).toBe('contributions:deepsikha:2025');
  });

  it('converts username to lowercase', () => {
    expect(cacheKey('repos', 'DeEpSiKhA')).toBe('repos:deepsikha');
  });

  it('supports profile kind', () => {
    expect(cacheKey('profile', 'testuser')).toContain('profile');
  });

  it('supports repos kind', () => {
    expect(cacheKey('repos', 'testuser')).toContain('repos');
  });

  it('supports contributions kind', () => {
    expect(cacheKey('contributions', 'testuser')).toContain('contributions');
  });
});

describe('buildCommitClock', () => {
  it('aggregates commits correctly by day of week', () => {
    const allDays = [
      { date: '2024-06-09', contributionCount: 2 }, // Sun
      { date: '2024-06-10', contributionCount: 5 }, // Mon
      { date: '2024-06-10', contributionCount: 3 }, // Mon
      { date: '2024-06-12', contributionCount: 4 }, // Wed
    ];

    const result = buildCommitClock(allDays);

    expect(result).toEqual([
      { day: 'Sun', commits: 2 },
      { day: 'Mon', commits: 8 },
      { day: 'Tue', commits: 0 },
      { day: 'Wed', commits: 4 },
      { day: 'Thu', commits: 0 },
      { day: 'Fri', commits: 0 },
      { day: 'Sat', commits: 0 },
    ]);
  });
});
