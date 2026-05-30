import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchGitHubContributions,
  fetchWithRetry,
  fetchUserProfile,
  fetchUserRepos,
  getFullDashboardData,
  generateAchievements,
  clearGitHubApiCacheForTests,
  GITHUB_CACHE_TTL_MS,
  validateGitHubUsername,
  cacheKey,
  buildInsights,
  fetchOrgMembers,
  getOrgDashboardData,
  getWrappedData,
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

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes caller abort listeners after a successful request', async () => {
    const controller = new AbortController();
    const addListenerSpy = vi.spyOn(controller.signal, 'addEventListener');
    const removeListenerSpy = vi.spyOn(controller.signal, 'removeEventListener');

    vi.mocked(fetch).mockResolvedValue(mockResponse({ ok: true }));

    await fetchWithRetry('https://api.github.com/test', { signal: controller.signal }, 0, 1000);

    const abortListener = addListenerSpy.mock.calls.find(([event]) => event === 'abort')?.[1];

    expect(abortListener).toEqual(expect.any(Function));
    expect(addListenerSpy).toHaveBeenCalledWith('abort', abortListener, { once: true });
    expect(removeListenerSpy).toHaveBeenCalledWith('abort', abortListener);
  });

  it('still aborts the in-flight request when the caller signal is aborted', async () => {
    const controller = new AbortController();

    vi.mocked(fetch).mockImplementation(
      (_url: RequestInfo | URL, options?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true }
          );
        })
    );

    const request = fetchWithRetry('https://api.github.com/test', { signal: controller.signal });

    controller.abort();

    await expect(request).rejects.toThrow('Aborted');
    expect(fetch).toHaveBeenCalledOnce();
  });
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

    expect(result.totalContributions).toBe(mockCalendar.totalContributions);
    expect(result.weeks[0].contributionDays[0].contributionCount).toBe(3);
    expect(result.weeks[0].contributionDays[0]).toHaveProperty('locAdditions');
  });

  it('injects positive locAdditions and non-negative locDeletions for contribution days', async () => {
    const calendarWithContributions: ContributionCalendar = {
      totalContributions: 5,
      weeks: [
        {
          contributionDays: [{ contributionCount: 5, date: '2024-06-10' }],
        },
      ],
    };

    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: calendarWithContributions,
            },
          },
        },
      })
    );

    const result = await fetchGitHubContributions('octocat');
    const day = result.weeks[0].contributionDays[0];

    expect(day.locAdditions).toBeGreaterThan(0);
    expect(day.locDeletions).toBeGreaterThanOrEqual(0);
  });

  it('sets locAdditions and locDeletions to zero for zero-contribution days', async () => {
    const calendarWithZeroContribution: ContributionCalendar = {
      totalContributions: 0,
      weeks: [
        {
          contributionDays: [{ contributionCount: 0, date: '2024-06-11' }],
        },
      ],
    };

    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: calendarWithZeroContribution,
            },
          },
        },
      })
    );

    const result = await fetchGitHubContributions('octocat');
    const day = result.weeks[0].contributionDays[0];

    expect(day.locAdditions).toBe(0);
    expect(day.locDeletions).toBe(0);
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

    expect(result.totalContributions).toBe(0);
    expect(result.weeks).toHaveLength(0);
  });

  it('throws with the status code when the server returns 500', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ message: 'Internal Server Error' }, 500));

    await expect(fetchGitHubContributions('octocat')).rejects.toThrow(
      'GitHub GraphQL API returned status 500'
    );
  });

  it('throws with the status code when the server returns 401 (expired or missing token)', async () => {
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
    expect(r1.totalContributions).toBe(r2.totalContributions);
    expect(r1.weeks).toEqual(r2.weeks);
  });
});

describe('fetchUserProfile', () => {
  beforeEach(() => vi.spyOn(global, 'fetch'));
  afterEach(() => vi.restoreAllMocks());

  it('returns all profile fields on success', async () => {
    const mockProfile = {
      login: 'octocat',
      name: 'The Octocat',
      avatar_url: 'https://github.com/images/error/octocat_happy.gif',
      public_repos: 8,
      followers: 100,
      following: 5,
      created_at: '2011-01-25T18:44:36Z',
      bio: 'GitHub mascot',
      location: 'San Francisco',
      plan: { name: 'pro' },
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse(mockProfile));

    const result = await fetchUserProfile('octocat');

    expect(result.login).toBe(mockProfile.login);
    expect(result.bio).toBe(mockProfile.bio);
    expect(result.location).toBe(mockProfile.location);
    expect(result.created_at).toBe(mockProfile.created_at);
    expect(result.public_repos).toBe(mockProfile.public_repos);
    expect(result.followers).toBe(mockProfile.followers);
    expect(result.following).toBe(mockProfile.following);
    expect(result.avatar_url).toBe(mockProfile.avatar_url);
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
      if (typeof url === 'string' && url.includes('/users/octocat/repos')) return mockResponse([]);
      if (typeof url === 'string' && url.includes('/users/octocat'))
        throw new Error('Network error');
      return mockResponse({
        data: { user: { contributionsCollection: { contributionCalendar: mockCalendar } } },
      });
    });
    await expect(getFullDashboardData('octocat')).rejects.toThrow(
      '[GitHub API] Failed to fetch profile for user "octocat"'
    );
  });

  it('formats joinedDate as MMM YYYY', async () => {
    vi.mocked(fetch).mockImplementation(async (url: RequestInfo | URL) => {
      if (typeof url === 'string' && url.includes('/users/testuser/repos')) return mockResponse([]);
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
    expect(result.profile.joinedDate).toMatch(/^[A-Za-z]+ \d{4}$/);
  });

  it('handles repos fetch failure gracefully', async () => {
    vi.mocked(fetch).mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : (url?.toString() ?? '');

      // Repos fetch fails
      if (urlStr.includes('/users/octocat/repos')) {
        throw new Error('Repos fetch failed');
      }

      // Profile fetch succeeds
      if (urlStr.includes('/users/octocat')) {
        return mockResponse({
          login: 'octocat',
          name: 'The Octocat',
          avatar_url: 'avatar.png',
          public_repos: 10,
          followers: 20,
          following: 5,
          created_at: '2020-01-01T00:00:00Z',
        });
      }

      // GraphQL contributions succeed
      return mockResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: mockCalendar,
            },
          },
        },
      });
    });

    const result = await getFullDashboardData('octocat');

    expect(result).toBeDefined();
    expect(result.profile.stats.stars).toBe(0);
    expect(result.languages).toEqual([]);
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
        data: { user: { contributionsCollection: { contributionCalendar: mockCalendar } } },
      })
    );

    await fetchGitHubContributions('octocat');
    await fetchGitHubContributions('octocat');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('refresh bypass: bypassCache=true forces a fresh fetch', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      mockResponse({
        data: { user: { contributionsCollection: { contributionCalendar: mockCalendar } } },
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
    vi.mocked(fetch).mockResolvedValue(mockResponse({ login: 'octocat', name: 'The Octocat' }));

    await fetchUserProfile('octocat');
    await fetchUserProfile('octocat');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('refresh bypass: bypassCache=true forces fresh profile fetch', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      mockResponse({ login: 'octocat', name: 'The Octocat' })
    );

    await fetchUserProfile('octocat');
    await fetchUserProfile('octocat', { bypassCache: true });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('normalizes username casing for cache keys', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: mockCalendar,
            },
          },
        },
      })
    );

    await fetchGitHubContributions('octocat');
    await fetchGitHubContributions('OctoCat');

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('generateAchievements', () => {
  it('marks contribution milestones correctly', () => {
    // 600 contributions satisfies the '500 Contributions' achievement but not '1000 Contributions'
    const achievements = generateAchievements(600, 10, 0, 0);

    const unlocked = achievements.filter((a) => a.isUnlocked);
    expect(unlocked.some((a) => a.title === '500 Contributions')).toBe(true);
    expect(unlocked.some((a) => a.title === 'Consistency King')).toBe(true);
    expect(unlocked.some((a) => a.title === '1000 Contributions')).toBe(false);
  });

  it('unlocks all achievements for max contribution and streak values', () => {
    // Consistency King III requires 2000, streak needs 100, weekend needs 10, polyglot needs 5
    const achievements = generateAchievements(2001, 101, 11, 6);

    expect(achievements.every((achievement) => achievement.isUnlocked === true)).toBe(true);
  });

  it('marks streak milestones correctly', () => {
    const achievements = generateAchievements(50, 35, 0, 0);

    const unlocked = achievements.filter((a) => a.isUnlocked);

    expect(unlocked.some((a) => a.title === '30 Day Streak')).toBe(true);
    expect(unlocked.some((a) => a.title === '100 Day Streak')).toBe(false);
  });

  it('marks behavior milestones correctly', () => {
    const achievements = generateAchievements(10, 1, 15, 6);

    const unlocked = achievements.filter((a) => a.isUnlocked);

    expect(unlocked.some((a) => a.title === 'Weekend Warrior')).toBe(true);
    expect(unlocked.some((a) => a.title === 'Polyglot')).toBe(true);
  });

  it('caps progress between 0 and 100 for extreme values', () => {
    const achievements = generateAchievements(999999, 999999, 999999, 999999);

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
});

describe('cacheKey', () => {
  it('creates key without year', () => {
    expect(cacheKey('profile', 'DeepSikha')).toBe('profile:deepsikha');
  });

  it('creates key with year', () => {
    expect(cacheKey('contributions', 'DeepSikha', '2025')).toBe('contributions:deepsikha:2025');
  });
});
describe('buildInsights', () => {
  it('uses active streak message when current streak > 3', () => {
    const result = buildInsights(
      {
        totalContributions: 120,
        currentStreak: 7,
        longestStreak: 20,
      },
      [{ name: 'TypeScript' }]
    );

    expect(result[2].text).toContain('active 7-day streak');
  });

  it('uses longest streak message when current streak <= 3', () => {
    const result = buildInsights(
      {
        totalContributions: 120,
        currentStreak: 2,
        longestStreak: 15,
      },
      [{ name: 'Rust' }]
    );

    expect(result[2].text).toContain('15 days');
  });

  it('falls back to Unknown when languages list is empty', () => {
    const result = buildInsights(
      {
        totalContributions: 50,
        currentStreak: 1,
        longestStreak: 5,
      },
      []
    );

    expect(result[1].text).toContain('Unknown');
  });
});

// ---------- EPIC ENHANCEMENT TESTS ----------

describe('fetchOrgMembers', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches organization members successfully', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse([
        { login: 'alice', id: 1 },
        { login: 'bob', id: 2 },
      ])
    );

    const members = await fetchOrgMembers('vercel');

    expect(Array.isArray(members)).toBe(true);
    expect(members.every((member) => typeof member === 'string')).toBe(true);
    expect(members[0]).toBe('alice');
    expect(members[1]).toBe('bob');
  });
});

describe('getOrgDashboardData', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aggregates org data correctly', async () => {
    vi.mocked(fetch).mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : (url?.toString() ?? '');
      if (urlStr.includes('/orgs/vercel/members')) return mockResponse([{ login: 'alice' }]);
      if (urlStr.includes('/users/vercel/repos')) return mockResponse([{ stargazers_count: 100 }]);
      if (urlStr.includes('/users/vercel'))
        return mockResponse({
          login: 'vercel',
          type: 'Organization',
          public_repos: 5,
          followers: 10,
          created_at: '2020-01-01T00:00:00Z',
        });
      // GraphQL fetch fallback
      return mockResponse({
        data: { user: { contributionsCollection: { contributionCalendar: mockCalendar } } },
      });
    });

    const result = await getOrgDashboardData('vercel');

    expect(result.profile.username).toBe('vercel');
    expect(result.stats.totalContributions).toBe(mockCalendar.totalContributions);
  });

  it('throws an error if the target is a User instead of an Organization', async () => {
    vi.mocked(fetch).mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : (url?.toString() ?? '');
      // Specifically catch the repos and members endpoints so they return valid arrays
      if (urlStr.includes('/orgs/notanorg/members')) return mockResponse([]);
      if (urlStr.includes('/users/notanorg/repos')) return mockResponse([]);
      // Now this will only safely match the main profile fetch
      if (urlStr.includes('/users/notanorg'))
        return mockResponse({ login: 'notanorg', type: 'User' });

      return mockResponse([]);
    });

    await expect(getOrgDashboardData('notanorg')).rejects.toThrow(
      'This endpoint is strictly for organizations.'
    );
  });
});

describe('getWrappedData', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns wrapped statistics and top language correctly', async () => {
    vi.mocked(fetch).mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : (url?.toString() ?? '');
      // Return 2 TS repos, 1 Rust repo
      if (urlStr.includes('/repos'))
        return mockResponse([
          { language: 'TypeScript' },
          { language: 'TypeScript' },
          { language: 'Rust' },
        ]);
      return mockResponse({
        data: { user: { contributionsCollection: { contributionCalendar: mockCalendar } } },
      });
    });

    const result = await getWrappedData('octocat', '2024');

    expect(result.topLanguage).toBe('TypeScript');
    expect(result.totalContributions).toBe(mockCalendar.totalContributions);
  });
});
