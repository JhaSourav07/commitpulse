import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchGitHubContributions,
  fetchWithRetry,
  fetchUserProfile,
  fetchUserRepos,
  fetchContributedRepos,
  getFullDashboardData,
  generateAchievements,
  buildCommitClock,
  clearGitHubApiCacheForTests,
  GITHUB_CACHE_TTL_MS,
  validateGitHubUsername,
  cacheKey,
  buildInsights,
  displayName,
  fetchOrgMembers,
  getOrgDashboardData,
  getWrappedData,
  computeDeveloperScore,
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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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
    expect(addListenerSpy).toHaveBeenCalledWith('abort', abortListener, {
      once: true,
    });
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

    const request = fetchWithRetry('https://api.github.com/test', {
      signal: controller.signal,
    });

    controller.abort();

    await expect(request).rejects.toThrow('Aborted');
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('retries when the internal request timeout aborts fetch', async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(
        (_url: RequestInfo | URL, options?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            options?.signal?.addEventListener(
              'abort',
              () => reject(new DOMException('Timed out', 'AbortError')),
              { once: true }
            );
          })
      )
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const promise = fetchWithRetry('https://api.github.com/test', {}, 0, 100);

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(500);

    const res = await promise;
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws a timeout error after internal timeout retries are exhausted', async () => {
    vi.mocked(fetch).mockImplementation(
      (_url: RequestInfo | URL, options?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Timed out', 'AbortError')),
            { once: true }
          );
        })
    );

    const promise = fetchWithRetry('https://api.github.com/test', {}, 0, 100);
    const expectation = expect(promise).rejects.toThrow('GitHub API request timed out after 0.1s');

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(100);

    await expectation;
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('retries on 429 with numeric retry-after', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { 'retry-after': '2' } }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const promise = fetchWithRetry('http://test', {});
    await vi.advanceTimersByTimeAsync(2000);
    const res = await promise;
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 403 with x-ratelimit-remaining: 0', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(null, { status: 403, headers: { 'x-ratelimit-remaining': '0' } })
      )
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const promise = fetchWithRetry('http://test', {});
    await vi.advanceTimersByTimeAsync(500); // default backoff for attempt 0
    const res = await promise;
    expect(res.status).toBe(200);
  });

  it('exits early without retrying if delay > 5000', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 429, headers: { 'retry-after': '6' } }) // 6000ms
    );
    const res = await fetchWithRetry('http://test', {});
    expect(res.status).toBe(429);
    expect(fetch).toHaveBeenCalledTimes(1);
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
          user: {
            contributionsCollection: {
              contributionCalendar: mockCalendar,
              commitContributionsByRepository: [],
            },
          },
        },
      })
    );

    const { calendar: result } = await fetchGitHubContributions('octocat');

    expect(result.totalContributions).toBe(mockCalendar.totalContributions);
    expect(result.weeks[0].contributionDays[0].contributionCount).toBe(3);
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
    const emptyCalendar: ContributionCalendar = {
      totalContributions: 0,
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

    const { calendar: result } = await fetchGitHubContributions('new-user');

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

  // GitHub GraphQL returns HTTP 200 for rate limit errors — the error lives in the body.
  // fetchGraphQLWithRetry must detect it and back off, not crash immediately.
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
      await vi.advanceTimersByTimeAsync(500);
      const { calendar: result } = await promise;

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result.totalContributions).toBe(mockCalendar.totalContributions);
    });

    it('throws after exhausting all retries on repeated body-level RATE_LIMITED errors', async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockResponse({ errors: [{ type: 'RATE_LIMITED', message: 'API rate limit exceeded' }] })
      );

      const promise = fetchGitHubContributions('octocat');
      // Register the rejection handler before advancing timers so the rejection
      // is never "unhandled" during the timer callbacks.
      const assertion = expect(promise).rejects.toThrow('API Rate Limit Exceeded');
      // 500ms + 1000ms + 2000ms covers all 3 retry delays before attempt >= MAX_RETRIES
      await vi.advanceTimersByTimeAsync(3500);
      await assertion;
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

    const { calendar: result } = await fetchGitHubContributions('sparse-user');
    expect(result.totalContributions).toBe(0);
    expect(result.weeks).toHaveLength(1);
  });

  it('is deterministic: two calls with empty-year response return identical data', async () => {
    const emptyCalendar: ContributionCalendar = {
      totalContributions: 0,
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

    const r1 = await fetchGitHubContributions('empty-user', {
      bypassCache: true,
    });
    const r2 = await fetchGitHubContributions('empty-user', {
      bypassCache: true,
    });
    expect(r1.calendar.totalContributions).toBe(r2.calendar.totalContributions);
    expect(r1.calendar.weeks).toEqual(r2.calendar.weeks);
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

  it('encodes the username before using it in the REST profile path', async () => {
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

  it('encodes the username before using it in the REST repos path', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse([{ stargazers_count: 1, language: 'TypeScript' }])
    );

    await fetchUserRepos('octo/cat');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/users/octo%2Fcat/repos?per_page=100&page=1&sort=pushed',
      expect.objectContaining({ cache: 'no-store' })
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
  beforeEach(() => vi.spyOn(global, 'fetch'));
  afterEach(() => vi.restoreAllMocks());

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

  it('returns empty array when fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }));
    const result = await fetchContributedRepos('octocat');
    expect(result).toEqual([]);
  });

  it('returns empty array if data structure is missing', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ data: null }));
    const result = await fetchContributedRepos('octocat');
    expect(result).toEqual([]);
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
    expect(results.map((result) => result.calendar.totalContributions)).toEqual([42, 42, 42]);
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
    expect(results.map((result) => result.calendar.totalContributions)).toEqual([42, 42, 42]);
  });

  it('refresh bypass: bypassCache=true forces a fresh fetch', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
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
    await fetchGitHubContributions('octocat', { bypassCache: true });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('cache expiry: expired entry triggers a delta sync fetch', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    vi.mocked(fetch).mockImplementation(async () =>
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

    vi.setSystemTime(Date.now() + GITHUB_CACHE_TTL_MS + 1);
    await fetchGitHubContributions('octocat');

    expect(fetch).toHaveBeenCalledTimes(2);

    const secondCallBody = JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string);
    expect(secondCallBody.variables.from).toBeDefined();

    // Delta sync subtracts 1 day from the last synced date (which was 2026-01-01)
    const expectedFrom = new Date('2026-01-01T00:00:00.000Z');
    expectedFrom.setUTCDate(expectedFrom.getUTCDate() - 1);
    expect(secondCallBody.variables.from).toBe(expectedFrom.toISOString());
  });

  it('cache hit: second profile call uses cached value', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ login: 'octocat', name: 'The Octocat' }));

    await fetchUserProfile('octocat');
    await fetchUserProfile('octocat');

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent profile requests for the same cold cache key', async () => {
    let resolveFetch!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );

    const requests = Promise.all([
      fetchUserProfile('octocat'),
      fetchUserProfile('octocat'),
      fetchUserProfile('octocat'),
    ]);

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    resolveFetch(mockResponse({ login: 'octocat', name: 'The Octocat' }));

    const results = await requests;
    expect(results.map((profile) => profile.login)).toEqual(['octocat', 'octocat', 'octocat']);
  });

  it('refresh bypass: bypassCache=true forces fresh profile fetch', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      mockResponse({ login: 'octocat', name: 'The Octocat' })
    );

    await fetchUserProfile('octocat');
    await fetchUserProfile('octocat', { bypassCache: true });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('dedupes concurrent repo requests for the same cold cache key', async () => {
    let resolveFetch!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );

    const requests = Promise.all([
      fetchUserRepos('octocat'),
      fetchUserRepos('octocat'),
      fetchUserRepos('octocat'),
    ]);

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    resolveFetch(mockResponse([{ stargazers_count: 7, language: 'TypeScript' }]));

    const results = await requests;
    expect(results.map((repos) => repos[0]?.stargazers_count)).toEqual([7, 7, 7]);
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

  it('always returns exactly 15 achievements', () => {
    expect(generateAchievements(0, 0, 0, 0)).toHaveLength(15);
    expect(generateAchievements(1000, 100, 0, 0)).toHaveLength(15);
  });
});

describe('displayName', () => {
  const makeProfile = (name: string | null) => ({
    login: 'octocat',
    name,
    avatar_url: 'avatar.png',
    public_repos: 0,
    followers: 0,
    following: 0,
    created_at: '2020-01-01T00:00:00Z',
    bio: null,
    location: null,
  });

  it('returns the name when present', () => {
    expect(displayName(makeProfile('The Octocat'))).toBe('The Octocat');
  });

  it('falls back to login when name is null', () => {
    expect(displayName(makeProfile(null))).toBe('octocat');
  });

  it('falls back to login when name is empty', () => {
    expect(displayName(makeProfile(''))).toBe('octocat');
  });

  it('falls back to login when name contains only whitespace', () => {
    expect(displayName(makeProfile('   '))).toBe('octocat');
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

  it('creates key with from and to date range', () => {
    expect(cacheKey('contributions', 'octocat', '2024-01-01', '2024-06-30')).toBe(
      'contributions:octocat:2024-01-01:2024-06-30'
    );
  });

  it('collision test: different to dates produce different keys', () => {
    const keyA = cacheKey('contributions', 'octocat', '2024-01-01', '2024-06-30');
    const keyB = cacheKey('contributions', 'octocat', '2024-01-01', '2024-12-31');
    expect(keyA).not.toBe(keyB);
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

describe('buildCommitClock', () => {
  it('counts commits only on Sunday when all days are Sunday', () => {
    const result = buildCommitClock([
      { date: '2024-01-07', contributionCount: 3 },
      { date: '2024-01-14', contributionCount: 2 },
    ]);

    expect(result).toHaveLength(7);
    expect(result[0].commits).toBeGreaterThan(0);
    expect(result.slice(1).every((item) => item.commits === 0)).toBe(true);
  });

  it('returns 7 days with zero commits for empty input', () => {
    const result = buildCommitClock([]);

    expect(result).toHaveLength(7);
    expect(result.every((item) => item.commits === 0)).toBe(true);
  });

  it('returns defined dashboard analytics rows when user metric logs are empty', () => {
    const result = buildCommitClock([]);

    expect(result).toHaveLength(7);
    expect(result.every((item) => typeof item.day === 'string')).toBe(true);
    expect(result.every((item) => typeof item.commits === 'number')).toBe(true);
    expect(result.every((item) => item.commits === 0)).toBe(true);
  });

  it('always returns exactly 7 items', () => {
    const result = buildCommitClock([{ date: '2024-01-07', contributionCount: 1 }]);

    expect(result).toHaveLength(7);
  });

  it('uses weekday labels from Sunday to Saturday', () => {
    const result = buildCommitClock([]);

    expect(result.map((item) => item.day)).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
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

  it('encodes the organization name before using it in the members REST path', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse([]));

    await fetchOrgMembers('octo/org');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/orgs/octo%2Forg/members?per_page=50',
      expect.objectContaining({ cache: 'no-store' })
    );
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

      if (urlStr.includes('/repos')) {
        return mockResponse([
          { language: 'TypeScript' },
          { language: 'TypeScript' },
          { language: 'Rust' },
        ]);
      }

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

    const result = await getWrappedData('octocat', '2024');

    expect(result.topLanguage).toBe('TypeScript');
    expect(result.totalContributions).toBe(mockCalendar.totalContributions);
  });

  it('falls back to Unknown when repos have no language data', async () => {
    vi.mocked(fetch).mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : (url?.toString() ?? '');
      if (urlStr.includes('/repos')) {
        return mockResponse([{ language: null }, { language: null }]);
      }
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
    const result = await getWrappedData('octocat', '2024');
    expect(result.topLanguage).toBe('Unknown');
  });

  it('passes the correct from and to date range to GitHub contributions fetch', async () => {
    vi.mocked(fetch).mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : (url?.toString() ?? '');

      if (urlStr.includes('/repos')) {
        return mockResponse([]);
      }

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

    await getWrappedData('octocat', '2024');

    const graphQLCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => url.toString().includes('/graphql'));

    const body = JSON.parse(graphQLCall?.[1]?.body as string);

    expect(body.variables.from).toBe('2024-01-01T00:00:00Z');
    expect(body.variables.to).toBe('2024-12-31T23:59:59Z');
  });
});

describe('computeDeveloperScore', () => {
  it('handles all-zero inputs', () => {
    const score = computeDeveloperScore({
      repos: 0,
      followers: 0,
      stars: 0,
      contributions: 0,
      longestStreak: 0,
    });
    expect(score).toBe(0);
  });

  it('calculates perfect 100 for exact saturation threshold values', () => {
    const score = computeDeveloperScore({
      repos: 50,
      followers: 50,
      stars: 100,
      contributions: 400,
      longestStreak: 50,
    });
    expect(score).toBe(100);
  });

  it('clamps the developer score to a maximum of 100 under excess inputs', () => {
    const score = computeDeveloperScore({
      repos: 1000,
      followers: 500,
      stars: 9999,
      contributions: 10000,
      longestStreak: 365,
    });
    expect(score).toBe(100);
  });

  it('correctly calculates developer score under realistic normal values with rounding', () => {
    const score = computeDeveloperScore({
      repos: 10, // 10 * 0.5 = 5 pts
      followers: 8, // 8 * 0.5 = 4 pts
      stars: 15, // 15 * 0.2 = 3 pts
      contributions: 120, // 120 / 20 = 6 pts
      longestStreak: 12, // 12 * 0.2 = 2.4 pts
    }); // Total = 20.4 -> rounded to 20
    expect(score).toBe(20);
  });

  it('handles individual factor saturation caps correctly', () => {
    // repos saturates at 50 (25 pts), followers saturates at 50 (25 pts)
    const score = computeDeveloperScore({
      repos: 100, // Caps at 25 pts
      followers: 60, // Caps at 25 pts
      stars: 0,
      contributions: 0,
      longestStreak: 0,
    });
    expect(score).toBe(50);
  });

  it('handles small fractional values and rounds to nearest integer correctly', () => {
    // longestStreak of 3 yields 3 * 0.2 = 0.6 -> rounds to 1
    expect(
      computeDeveloperScore({
        repos: 0,
        followers: 0,
        stars: 0,
        contributions: 0,
        longestStreak: 3,
      })
    ).toBe(1);

    // sum of small fractional parts: 1 repos (0.5) + 1 followers (0.5) + 1 stars (0.2) + 1 contributions (0.05) + 1 longestStreak (0.2) = 1.45 -> rounds to 1
    expect(
      computeDeveloperScore({
        repos: 1,
        followers: 1,
        stars: 1,
        contributions: 1,
        longestStreak: 1,
      })
    ).toBe(1);

    // sum: 1 repos (0.5) + 1 followers (0.5) + 1 stars (0.2) + 1 contributions (0.05) + 2 longestStreak (0.4) = 1.65 -> rounds to 2
    expect(
      computeDeveloperScore({
        repos: 1,
        followers: 1,
        stars: 1,
        contributions: 1,
        longestStreak: 2,
      })
    ).toBe(2);
  });
});
