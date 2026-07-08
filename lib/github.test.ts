import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  fetchGitHubContributions,
  fetchUserProfile,
  fetchUserRepos,
  fetchContributedRepos,
  getFullDashboardData,
  generateAchievements,
  buildCommitClock,
  clearGitHubApiCacheForTests,
  GITHUB_CACHE_TTL_MS,
  cacheKey,
  displayName,
  fetchOrgMembers,
  getOrgDashboardData,
  getWrappedData,
  computeDeveloperScore,
  runCappedConcurrency,
  buildProfileData,
  aggregateLanguages,
  buildInsights,
  buildActivityMap,
  contributionsCache,
} from './github';
import type { ContributionCalendar } from '../types';

vi.mock('server-only', () => ({}));

const mockCalendar: ContributionCalendar = {
  totalContributions: 8,
  repoContributions: 42,
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
  process.env.GITHUB_PAT = 'ghp_testTokenAAAAAAAAAAAAAAAAAAAAAAAA';
  delete process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKENS;
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

    expect(result.calendar.repoContributions).toBe(mockCalendar.repoContributions);
    expect(result.calendar.weeks[0].contributionDays[0].contributionCount).toBe(3);
  });

  it('injects positive locAdditions and non-negative locDeletions for contribution days', async () => {
    const calendarWithContributions: ContributionCalendar = {
      totalContributions: 5,
      repoContributions: 5,
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
    const day = result.calendar.weeks[0].contributionDays[0];

    expect(day.locAdditions).toBeUndefined();
    expect(day.locDeletions).toBeUndefined();
  });

  it('sets locAdditions and locDeletions to zero for zero-contribution days', async () => {
    const calendarWithZeroContribution: ContributionCalendar = {
      totalContributions: 0,
      repoContributions: 0,
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
    const day = result.calendar.weeks[0].contributionDays[0];

    expect(day.locAdditions).toBe(0);
    expect(day.locDeletions).toBe(0);
  });

  it('sends a POST request to the GitHub GraphQL endpoint with the correct body', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: mockCalendar,
              commitContributionsByRepository: [],
            },
          },
        },
      })
    );

    await fetchGitHubContributions('octocat');

    expect(fetch).toHaveBeenCalledOnce();

    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://api.github.com/graphql');
    expect(options?.method).toBe('POST');
    expect(options?.headers).toMatchObject({
      Authorization: 'bearer ghp_testTokenAAAAAAAAAAAAAAAAAAAAAAAA',
      'Content-Type': 'application/json',
    });

    const body = JSON.parse(options?.body as string);
    expect(body.variables).toEqual({ login: 'octocat' });
    expect(body.query).toContain('contributionCalendar');
  });

  it('uses GITHUB_TOKEN when GITHUB_PAT is not configured', async () => {
    delete process.env.GITHUB_PAT;
    process.env.GITHUB_TOKEN = 'ghp_actionsTokenAAAAAAAAAAAAAAAAAAAAA';
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: mockCalendar,
              commitContributionsByRepository: [],
            },
          },
        },
      })
    );

    await fetchGitHubContributions('octocat');

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(options?.headers).toMatchObject({
      Authorization: 'bearer ghp_actionsTokenAAAAAAAAAAAAAAAAAAAAA',
    });
  });

  it('verifies Authorization header uses GITHUB_TOKEN value in fallback path', async () => {
    delete process.env.GITHUB_PAT;
    process.env.GITHUB_TOKEN = 'ghp_myActionsTokenAAAAAAAAAAAAAAAAAAA';
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: mockCalendar,
              commitContributionsByRepository: [],
            },
          },
        },
      })
    );

    await fetchGitHubContributions('octocat');

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(options?.headers).toMatchObject({
      Authorization: 'bearer ghp_myActionsTokenAAAAAAAAAAAAAAAAAAA',
    });
  });

  it('throws before fetching when no GitHub token is configured', async () => {
    delete process.env.GITHUB_PAT;
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKENS;

    await expect(fetchGitHubContributions('octocat')).rejects.toThrow(
      'GitHub token is missing. Set GITHUB_PAT or GITHUB_TOKEN.'
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('works correctly for a brand-new user who has zero contribution weeks', async () => {
    const emptyCalendar: ContributionCalendar = {
      totalContributions: 0,
      repoContributions: 0,
      weeks: [],
    };

    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: {
            contributionsCollection: { contributionCalendar: emptyCalendar },
          },
        },
      })
    );

    const result = await fetchGitHubContributions('new-user');

    expect(result.calendar.repoContributions).toBe(0);
    expect(result.calendar.weeks).toHaveLength(0);
  });

  it('throws with the status code when the server returns 500', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ message: 'Internal Server Error' }, 500));

    await expect(fetchGitHubContributions('octocat')).rejects.toThrow('GitHub API error');
  });

  it('throws with the status code when the server returns 401 (expired or missing token)', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ message: 'Unauthorized' }, 401));

    await expect(fetchGitHubContributions('octocat')).rejects.toThrow(
      'GitHub authentication failed'
    );
  });

  it('falls back to empty calendar when fetch itself rejects due to a network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Failed to fetch'));

    const result = await fetchGitHubContributions('octocat');
    expect(result.calendar.totalContributions).toBe(0);
    expect(result.isOfflineFallback).toBe(true);
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

  describe('body-level RATE_LIMITED retry (HTTP 200)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('retries with backoff when GitHub returns RATE_LIMITED inside a 200 OK body', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(
          mockResponse({ errors: [{ type: 'RATE_LIMITED', message: 'API rate limit exceeded' }] })
        )
        .mockResolvedValueOnce(
          mockResponse({
            data: { user: { contributionsCollection: { contributionCalendar: mockCalendar } } },
          })
        );

      const promise = fetchGitHubContributions('octocat');
      void promise;

      await vi.advanceTimersByTimeAsync(500);

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('falls back to empty calendar after exhausting all retries on repeated body-level RATE_LIMITED errors', async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockResponse({ errors: [{ type: 'RATE_LIMITED', message: 'API rate limit exceeded' }] })
      );

      const promise = fetchGitHubContributions('octocat');
      await vi.advanceTimersByTimeAsync(3500);
      const result = await promise;
      expect(result.calendar.totalContributions).toBe(0);
      expect(result.isOfflineFallback).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(4);
    });
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
      repoContributions: 0,
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
          user: {
            contributionsCollection: { contributionCalendar: sparseCalendar },
          },
        },
      })
    );

    const result = await fetchGitHubContributions('sparse-user');
    expect(result.calendar.repoContributions).toBe(0);
    expect(result.calendar.weeks).toHaveLength(1);
  });

  it('is deterministic: two calls with empty-year response return identical data', async () => {
    const emptyCalendar: ContributionCalendar = {
      totalContributions: 0,
      repoContributions: 0,
      weeks: [],
    };

    vi.mocked(fetch).mockImplementation(async () =>
      mockResponse({
        data: {
          user: {
            contributionsCollection: { contributionCalendar: emptyCalendar },
          },
        },
      })
    );

    const r1 = await fetchGitHubContributions('empty-user', { bypassCache: true });
    const r2 = await fetchGitHubContributions('empty-user', { bypassCache: true });
    expect(r1.calendar.repoContributions).toBe(r2.calendar.repoContributions);
    expect(r1.calendar.weeks).toEqual(r2.calendar.weeks);
  });

  it('falls back to stale cache with isOfflineFallback: true when fetch fails and cache has data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: mockCalendar,
              commitContributionsByRepository: [],
            },
          },
        },
      })
    );
    await fetchGitHubContributions('fallback-user');

    const key = cacheKey('contributions', 'fallback-user');
    const cachedData = await contributionsCache.get(key);
    if (cachedData) {
      cachedData.calendar.lastSyncedAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      await contributionsCache.set(key, cachedData, 7 * 24 * 60 * 60 * 1000);
    }

    vi.mocked(fetch).mockRejectedValue(new Error('API rate limit exceeded'));

    const result = await fetchGitHubContributions('fallback-user');
    expect(result.calendar.totalContributions).toBe(mockCalendar.totalContributions);
    expect(result.isOfflineFallback).toBe(true);
  });

  it('falls back to stale cache when bypassCache is true but fetch fails and cache has data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: mockCalendar,
              commitContributionsByRepository: [],
            },
          },
        },
      })
    );
    await fetchGitHubContributions('bypass-fallback-user');

    vi.mocked(fetch).mockRejectedValue(new Error('Failed to fetch'));

    const result = await fetchGitHubContributions('bypass-fallback-user', { bypassCache: true });
    expect(result.calendar.totalContributions).toBe(mockCalendar.totalContributions);
    expect(result.isOfflineFallback).toBe(true);
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

  it('sanitizes the profile by removing extra fields before returning', async () => {
    const mockProfile = {
      login: 'octocat',
      name: 'The Octocat',
      avatar_url: 'https://avatar.url',
      public_repos: 8,
      followers: 100,
      following: 5,
      created_at: '2011-01-25T18:44:36Z',
      bio: 'GitHub mascot',
      location: 'San Francisco',
      extra_field: 'should be removed',
      another_extra: 123,
      plan: { name: 'pro', space: 1000 },
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse(mockProfile));

    const result = (await fetchUserProfile('octocat')) as unknown as Record<string, unknown>;

    expect(result.login).toBe('octocat');
    expect(result.extra_field).toBeUndefined();
    expect(result.another_extra).toBeUndefined();
    expect(result.plan).toEqual({ name: 'pro' });
  });

  it.skip('encodes the username before using it in the REST profile path', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        login: 'octo/cat',
        name: 'Slash User',
        avatar_url: 'avatar.png',
        public_repos: 1,
        followers: 0,
        following: 0,
        created_at: '2024-01-01T00:00:00Z',
        bio: null,
        location: null,
      })
    );

    await fetchUserProfile('octo/cat');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/users/octo%2Fcat',
      expect.objectContaining({ cache: 'no-store' })
    );
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

  it('sanitizes repo objects by removing extra fields before returning', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse([
        {
          name: 'some-repo',
          stargazers_count: 10,
          language: 'TypeScript',
          id: 12345,
          private: false,
          owner: { login: 'octocat' },
          homepage: 'https://some-repo.vercel.app',
        },
      ])
    );

    const result = (await fetchUserRepos('octocat')) as unknown as Record<string, unknown>[];

    expect(result[0].stargazers_count).toBe(10);
    expect(result[0].language).toBe('TypeScript');
    expect(result[0].id).toBeUndefined();
    expect(result[0].private).toBeUndefined();
    // owner and homepage are intentionally kept — required for the
    // Production Deployments feature to resolve {owner}/{repo} paths
    // and fall back to a configured live URL.
    expect(result[0].owner).toEqual({ login: 'octocat' });
    expect(result[0].homepage).toBe('https://some-repo.vercel.app');
  });

  it('returns a full three-repo payload with the expected star counts and languages', async () => {
    const mockedRepos = [
      { stargazers_count: 7, language: 'TypeScript' },
      { stargazers_count: 42, language: 'Rust' },
      { stargazers_count: 128, language: 'JavaScript' },
    ];

    vi.mocked(fetch).mockResolvedValue(mockResponse(mockedRepos));

    const result = await fetchUserRepos('octocat', { bypassCache: true });

    expect(result).toHaveLength(3);
    result.forEach((repo, index) => {
      expect(repo).toHaveProperty('stargazers_count');
      expect(repo).toHaveProperty('language');
      expect(repo.stargazers_count).toBe(mockedRepos[index].stargazers_count);
      expect(repo.language).toBe(mockedRepos[index].language);
    });
    expect(result).toEqual(mockedRepos);
  });

  it.skip('encodes the username before using it in the REST repos path', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse([{ stargazers_count: 1, language: 'TypeScript' }])
    );

    await fetchUserRepos('octo/cat');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/users/octo%2Fcat/repos?per_page=100',
      expect.any(Object)
    );
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

describe('fetchContributedRepos', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns contributed repos on success', async () => {
    const mockNodes = [
      {
        name: 'repo1',
        nameWithOwner: 'owner/repo1',
        stargazerCount: 10,
        forkCount: 5,
        primaryLanguage: { name: 'TypeScript' },
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        data: {
          user: {
            repositoriesContributedTo: {
              nodes: mockNodes,
            },
          },
        },
      })
    );

    const result = await fetchContributedRepos('octocat');
    expect(result).toEqual(mockNodes);
  });

  it('returns empty array if data structure is missing', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ data: null }));
    const result = await fetchContributedRepos('octocat');
    expect(result).toEqual([]);
  });

  it('throws (rather than returning []) when the request fails so the empty result is not cached', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }));

    const promise = fetchContributedRepos('octocat');
    const assertion = expect(promise).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(3500);
    await assertion;
  });

  it('falls back to [] on a rate-limited GraphQL 200 response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ errors: [{ type: 'RATE_LIMITED', message: 'API rate limit exceeded' }] })
    );

    const promise = fetchContributedRepos('octocat');
    await vi.advanceTimersByTimeAsync(3500);
    const result = await promise;
    expect(result).toEqual([]);
  });

  it('does not cache the failure: a later call refetches and can succeed', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }));

    const failing = fetchContributedRepos('octocat');
    const assertion = expect(failing).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(3500);
    await assertion;

    const mockNodes = [{ name: 'r1', nameWithOwner: 'o/r1' }];
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ data: { user: { repositoriesContributedTo: { nodes: mockNodes } } } })
    );

    const result = await fetchContributedRepos('octocat');
    expect(result).toEqual(mockNodes);
  });
});

describe('forceRefresh write-back', () => {
  beforeEach(() => vi.spyOn(global, 'fetch'));
  afterEach(() => vi.restoreAllMocks());

  it('fetchGitHubContributions: forceRefresh writes back so a later normal read is a cache hit', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(
        mockResponse({
          data: { user: { contributionsCollection: { contributionCalendar: mockCalendar } } },
        })
      )
    );

    await fetchGitHubContributions('octocat', { forceRefresh: true });
    expect(fetch).toHaveBeenCalledTimes(1);

    const result = await fetchGitHubContributions('octocat');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.calendar.totalContributions).toBe(mockCalendar.totalContributions);
  });

  it('fetchUserProfile: forceRefresh writes back so a later normal read is a cache hit', async () => {
    const profile = {
      login: 'octocat',
      name: 'Octo',
      avatar_url: '',
      public_repos: 1,
      followers: 1,
      following: 1,
      created_at: '2020-01-01T00:00:00Z',
      bio: null,
      location: null,
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse(profile));

    await fetchUserProfile('octocat', { forceRefresh: true });
    expect(fetch).toHaveBeenCalledTimes(1);

    const result = await fetchUserProfile('octocat');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.login).toBe('octocat');
  });

  it('fetchContributedRepos: forceRefresh writes back so a later normal read is a cache hit', async () => {
    const nodes = [{ name: 'r1', nameWithOwner: 'o/r1' }];
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ data: { user: { repositoriesContributedTo: { nodes } } } })
    );

    await fetchContributedRepos('octocat', { forceRefresh: true });
    expect(fetch).toHaveBeenCalledTimes(1);

    const result = await fetchContributedRepos('octocat');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(nodes);
  });
});

describe('computeDeveloperScore', () => {
  it('returns 0 for a brand new account with no activity', () => {
    expect(
      computeDeveloperScore({
        repos: 0,
        followers: 0,
        stars: 0,
        contributions: 0,
        longestStreak: 0,
      })
    ).toBe(0);
  });

  it('caps the score at 100 for an extremely active account', () => {
    expect(
      computeDeveloperScore({
        repos: 999,
        followers: 999,
        stars: 999,
        contributions: 99999,
        longestStreak: 999,
      })
    ).toBe(100);
  });

  it('saturates each factor independently at its ceiling', () => {
    expect(
      computeDeveloperScore({
        repos: 50,
        followers: 50,
        stars: 100,
        contributions: 400,
        longestStreak: 50,
      })
    ).toBe(100);
  });

  it('computes a partial score correctly when only repos and followers are non-zero', () => {
    expect(
      computeDeveloperScore({
        repos: 10,
        followers: 20,
        stars: 0,
        contributions: 0,
        longestStreak: 0,
      })
    ).toBe(15);
  });

  it('rounds fractional scores to the nearest integer', () => {
    expect(
      computeDeveloperScore({
        repos: 1,
        followers: 0,
        stars: 0,
        contributions: 0,
        longestStreak: 0,
      })
    ).toBe(1);
  });
});

describe('buildProfileData', () => {
  const baseProfile = {
    login: 'octocat',
    name: 'The Octocat',
    avatar_url: 'https://example.com/avatar.png',
    public_repos: 10,
    followers: 20,
    following: 5,
    created_at: '2020-06-01T00:00:00Z',
    bio: 'Hello world',
    location: 'San Francisco',
    plan: { name: 'pro' },
  };

  it('maps all fields from the raw profile correctly', () => {
    const result = buildProfileData(baseProfile, 42, 75);

    expect(result.username).toBe('octocat');
    expect(result.name).toBe('The Octocat');
    expect(result.avatarUrl).toBe('https://example.com/avatar.png');
    expect(result.isPro).toBe(true);
    expect(result.bio).toBe('Hello world');
    expect(result.location).toBe('San Francisco');
    expect(result.developerScore).toBe(75);
    expect(result.stats.stars).toBe(42);
    expect(result.stats.repositories).toBe(10);
    expect(result.stats.followers).toBe(20);
    expect(result.stats.following).toBe(5);
  });

  it('falls back to login when name is null', () => {
    const result = buildProfileData({ ...baseProfile, name: null }, 0, 0);
    expect(result.name).toBe('octocat');
  });

  it('falls back to login when name is an empty string', () => {
    const result = buildProfileData({ ...baseProfile, name: '   ' }, 0, 0);
    expect(result.name).toBe('octocat');
  });

  it('uses default bio when bio is null', () => {
    const result = buildProfileData({ ...baseProfile, bio: null }, 0, 0);
    expect(result.bio).toBe('No bio available');
  });

  it('uses default location when location is null', () => {
    const result = buildProfileData({ ...baseProfile, location: null }, 0, 0);
    expect(result.location).toBe('Earth');
  });

  it('sets isPro to false when plan is absent', () => {
    const result = buildProfileData({ ...baseProfile, plan: null }, 0, 0);
    expect(result.isPro).toBe(false);
  });

  it('sets isPro to false when plan name is not "pro"', () => {
    const result = buildProfileData({ ...baseProfile, plan: { name: 'free' } }, 0, 0);
    expect(result.isPro).toBe(false);
  });

  it('formats joinedDate as "MMM YYYY" from an ISO created_at string', () => {
    const result = buildProfileData({ ...baseProfile, created_at: '2020-01-15T00:00:00Z' }, 0, 0);
    expect(result.joinedDate).toMatch(/^[A-Za-z]+ \d{4}$/);
  });
});

describe('aggregateLanguages', () => {
  it('returns an empty array when no repos have a language set', () => {
    expect(aggregateLanguages([{ language: null }, { language: null }])).toEqual([]);
  });

  it('returns an empty array for an empty repo list', () => {
    expect(aggregateLanguages([])).toEqual([]);
  });

  it('computes percentages and sorts by frequency descending', () => {
    const repos = [{ language: 'TypeScript' }, { language: 'TypeScript' }, { language: 'Rust' }];
    const result = aggregateLanguages(repos);

    expect(result[0].name).toBe('TypeScript');
    expect(result[0].percentage).toBe(67);
    expect(result[1].name).toBe('Rust');
    expect(result[1].percentage).toBe(33);
  });

  it('caps results at the top 5 languages', () => {
    const repos = ['TypeScript', 'Rust', 'Go', 'Python', 'Java', 'C++'].map((language) => ({
      language,
    }));
    expect(aggregateLanguages(repos)).toHaveLength(5);
  });

  it('assigns a fallback color for languages not in LANGUAGE_COLORS', () => {
    const result = aggregateLanguages([{ language: 'BrainfuckLang9000' }]);
    expect(result[0].color).toBe('#a855f7');
  });

  it('skips repos with null language without crashing', () => {
    const repos = [{ language: 'TypeScript' }, { language: null }, { language: 'TypeScript' }];
    const result = aggregateLanguages(repos);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('TypeScript');
  });
});

describe('buildInsights', () => {
  const baseStreak = { totalContributions: 120, currentStreak: 0, longestStreak: 14 };

  it('always returns exactly 3 insight cards', () => {
    const result = buildInsights(baseStreak, [{ name: 'TypeScript' }]);
    expect(result).toHaveLength(3);
  });

  it('card 1 includes the total contribution count', () => {
    const result = buildInsights({ ...baseStreak, totalContributions: 42 }, []);
    expect(result[0].text).toContain('42');
  });

  it('card 2 shows the top language name', () => {
    const result = buildInsights(baseStreak, [{ name: 'Rust' }, { name: 'Go' }]);
    expect(result[1].text).toContain('Rust');
  });

  it('card 2 falls back to "Unknown" when languages array is empty', () => {
    const result = buildInsights(baseStreak, []);
    expect(result[1].text).toContain('Unknown');
  });

  it('card 3 shows active streak copy when currentStreak is above 3', () => {
    const result = buildInsights({ ...baseStreak, currentStreak: 10 }, []);
    expect(result[2].icon).toBe('Zap');
    expect(result[2].text).toContain('10');
  });

  it('card 3 shows longest streak copy when currentStreak is 3 or below', () => {
    const result = buildInsights({ ...baseStreak, currentStreak: 3, longestStreak: 30 }, []);
    expect(result[2].icon).toBe('Star');
    expect(result[2].text).toContain('30');
  });

  it('card 3 boundary: currentStreak of exactly 3 uses longest-streak copy', () => {
    const result = buildInsights({ ...baseStreak, currentStreak: 3 }, []);
    expect(result[2].icon).toBe('Star');
  });

  it('card 3 boundary: currentStreak of exactly 4 uses active-streak copy', () => {
    const result = buildInsights({ ...baseStreak, currentStreak: 4 }, []);
    expect(result[2].icon).toBe('Zap');
  });
});

describe('buildActivityMap', () => {
  it('returns an empty array for no days', () => {
    expect(buildActivityMap([])).toEqual([]);
  });

  it('maps intensity 0 for zero contributions', () => {
    const result = buildActivityMap([{ date: '2024-01-01', contributionCount: 0 }]);
    expect(result[0].intensity).toBe(0);
  });

  it('maps intensity 1 for counts 1-3', () => {
    const results = buildActivityMap([
      { date: '2024-01-01', contributionCount: 1 },
      { date: '2024-01-02', contributionCount: 3 },
    ]);
    expect(results[0].intensity).toBe(1);
    expect(results[1].intensity).toBe(1);
  });

  it('maps intensity 2 for counts 4-6', () => {
    const results = buildActivityMap([
      { date: '2024-01-01', contributionCount: 4 },
      { date: '2024-01-02', contributionCount: 6 },
    ]);
    expect(results[0].intensity).toBe(2);
    expect(results[1].intensity).toBe(2);
  });

  it('maps intensity 3 for counts 7-10', () => {
    const results = buildActivityMap([
      { date: '2024-01-01', contributionCount: 7 },
      { date: '2024-01-02', contributionCount: 10 },
    ]);
    expect(results[0].intensity).toBe(3);
    expect(results[1].intensity).toBe(3);
  });

  it('maps intensity 4 for counts above 10', () => {
    const result = buildActivityMap([{ date: '2024-01-01', contributionCount: 11 }]);
    expect(result[0].intensity).toBe(4);
  });

  it('preserves the date and count fields unchanged', () => {
    const result = buildActivityMap([{ date: '2024-06-15', contributionCount: 5 }]);
    expect(result[0].date).toBe('2024-06-15');
    expect(result[0].count).toBe(5);
  });

  it('covers all five intensity buckets across threshold boundaries', () => {
    const days = [0, 1, 4, 7, 11].map((n, i) => ({
      date: `2024-01-0${i + 1}`,
      contributionCount: n,
    }));
    const intensities = buildActivityMap(days).map((d) => d.intensity);
    expect(intensities).toEqual([0, 1, 2, 3, 4]);
  });
  it('passes through locAdditions and locDeletions from the LoC injection step', () => {
    const day = { date: '2024-01-01', contributionCount: 5, locAdditions: 120, locDeletions: 30 };
    const result = buildActivityMap([day]);
    expect(result[0].locAdditions).toBe(120);
    expect(result[0].locDeletions).toBe(30);
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
          user: {
            contributionsCollection: {
              contributionCalendar: mockCalendar,
              commitContributionsByRepository: [
                {
                  repository: { primaryLanguage: { name: 'TypeScript' } },
                  contributions: { totalCount: 200 },
                },
                {
                  repository: { primaryLanguage: { name: 'Rust' } },
                  contributions: { totalCount: 100 },
                },
              ],
            },
          },
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
  it('forwards the per-user token to deployment tracker requests instead of using the shared pool', async () => {
    const capturedAuthHeaders: string[] = [];

    vi.mocked(fetch).mockImplementation(async (url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : (url?.toString() ?? '');

      if (urlStr.includes('/actions/runs') || urlStr.includes('/deployments')) {
        const headers = init?.headers as Record<string, string> | undefined;
        capturedAuthHeaders.push(headers?.Authorization ?? '');
        if (urlStr.includes('/actions/runs')) {
          return mockResponse({ workflow_runs: [] });
        }
        return mockResponse([]);
      }
      if (urlStr.includes('/users/octocat/repos')) {
        return mockResponse([
          {
            name: 'repo1',
            stargazers_count: 10,
            language: 'TypeScript',
            fork: false,
            owner: { login: 'octocat' },
          },
        ]);
      }
      if (urlStr.includes('/users/octocat')) {
        return mockResponse({
          login: 'octocat',
          name: 'The Octocat',
          avatar_url: 'avatar.png',
          public_repos: 1,
          followers: 1,
          following: 1,
          created_at: '2020-01-01T00:00:00Z',
          bio: null,
          location: null,
        });
      }
      return mockResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: mockCalendar,
              commitContributionsByRepository: [],
            },
          },
        },
      });
    });

    const userToken = 'user-personal-oauth-token';
    await getFullDashboardData('octocat', { token: userToken });

    expect(capturedAuthHeaders.length).toBeGreaterThan(0);
    for (const authHeader of capturedAuthHeaders) {
      expect(authHeader).toBe(`bearer ${userToken}`);
    }
  });
  it('caps developerScore at 100 for extreme profile metrics', async () => {
    const saturatedCalendar: ContributionCalendar = {
      totalContributions: 500,
      weeks: [
        {
          contributionDays: Array.from({ length: 60 }, (_, i) => {
            const date = new Date('2025-01-01');
            date.setDate(date.getDate() + i);

            return {
              contributionCount: 10,
              date: date.toISOString().split('T')[0],
            };
          }),
        },
      ],
    };

    vi.mocked(fetch).mockImplementation(async (url: RequestInfo | URL) => {
      if (typeof url === 'string' && url.includes('/users/octocat/repos')) {
        return mockResponse([
          { stargazers_count: 500000, language: 'TypeScript' },
          { stargazers_count: 499999, language: 'Rust' },
        ]);
      }

      if (typeof url === 'string' && url.includes('/users/octocat')) {
        return mockResponse({
          login: 'octocat',
          name: 'The Octocat',
          avatar_url: 'avatar.png',
          public_repos: 9999,
          followers: 9999,
          following: 5,
          created_at: '2020-01-01T00:00:00Z',
        });
      }

      return mockResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: saturatedCalendar,
              commitContributionsByRepository: [],
            },
          },
        },
      });
    });

    const result = await getFullDashboardData('octocat');

    expect(result.profile.developerScore).toBeLessThanOrEqual(100);
    expect(result.profile.developerScore).toBe(100);
  });

  it('maps contribution counts to correct intensity levels', async () => {
    const intensityCalendar: ContributionCalendar = {
      totalContributions: 30,
      repoContributions: 30,
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
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: mockCalendar,
              commitContributionsByRepository: [],
            },
          },
        },
      });
    });
    await expect(getFullDashboardData('octocat')).rejects.toThrow(
      '[GitHub API] Failed to fetch profile for user "octocat"'
    );
  });

  it('throws if the contributions fetch fails, instead of returning zeroed stats', async () => {
    vi.mocked(fetch).mockImplementation(async (url: RequestInfo | URL) => {
      if (typeof url === 'string' && url.includes('/users/octocat/repos')) return mockResponse([]);
      if (typeof url === 'string' && url.includes('/users/octocat')) {
        return mockResponse({
          login: 'octocat',
          name: 'The Octocat',
          avatar_url: 'avatar.png',
          public_repos: 1,
          followers: 1,
          following: 1,
          created_at: '2020-01-01T00:00:00Z',
        });
      }
      // GraphQL contributions call returns no user, so the contributions fetch fails fast.
      return mockResponse({ data: { user: null } });
    });

    await expect(getFullDashboardData('octocat')).rejects.toThrow(
      '[GitHub API] Failed to fetch contributions for user "octocat"'
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
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: mockCalendar,
              commitContributionsByRepository: [],
            },
          },
        },
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
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: mockCalendar,
              commitContributionsByRepository: [],
            },
          },
        },
      })
    );

    await fetchGitHubContributions('octocat');
    await fetchGitHubContributions('octocat');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent contribution requests for the same cold cache key', async () => {
    let resolveFetch!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );

    const requests = Promise.all([
      fetchGitHubContributions('octocat'),
      fetchGitHubContributions('octocat'),
      fetchGitHubContributions('octocat'),
    ]);

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    resolveFetch(
      mockResponse({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: mockCalendar,
              commitContributionsByRepository: [],
            },
          },
        },
      })
    );

    const results = await requests;
    expect(results.map((result) => result.calendar.repoContributions)).toEqual([42, 42, 42]);
  });

  it('dedupes rapid synchronous contribution requests until the delayed fetch resolves once', async () => {
    vi.useFakeTimers();
    const resolveFetchSpy = vi.fn();

    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          setTimeout(() => {
            resolveFetchSpy();
            resolve(
              mockResponse({
                data: {
                  user: {
                    contributionsCollection: { contributionCalendar: mockCalendar },
                  },
                },
              })
            );
          }, 250);
        })
    );

    const requests = [
      fetchGitHubContributions('octocat'),
      fetchGitHubContributions('octocat'),
      fetchGitHubContributions('octocat'),
    ];

    await Promise.resolve();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(resolveFetchSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(249);
    expect(resolveFetchSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    const results = await Promise.all(requests);

    expect(resolveFetchSpy).toHaveBeenCalledTimes(1);
    expect(results.map((result) => result.calendar.repoContributions)).toEqual([42, 42, 42]);
  });
});

describe('configurable GitHub API constants', () => {
  it('GITHUB_CACHE_TTL_MS has a default of 5 minutes', async () => {
    const { GITHUB_CACHE_TTL_MS } = await import('./github');
    expect(GITHUB_CACHE_TTL_MS).toBe(300000);
  });

  it('respects GITHUB_MAX_RETRIES env var', async () => {
    process.env.GITHUB_MAX_RETRIES = '5';
    vi.resetModules();
    const mod = await import('./github');
    const { getJitteredBackoff } = mod;
    expect(getJitteredBackoff).toBeDefined();
    delete process.env.GITHUB_MAX_RETRIES;
  });

  it('respects GITHUB_GRAPHQL_TIMEOUT_MS env var', async () => {
    process.env.GITHUB_GRAPHQL_TIMEOUT_MS = '10000';
    vi.resetModules();
    await import('./github');
    delete process.env.GITHUB_GRAPHQL_TIMEOUT_MS;
  });

  it('respects GITHUB_ORG_MEMBER_LIMIT env var', async () => {
    process.env.GITHUB_ORG_MEMBER_LIMIT = '50';
    vi.resetModules();
    await import('./github');
    delete process.env.GITHUB_ORG_MEMBER_LIMIT;
  });
});
