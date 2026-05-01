/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchGitHubContributions,
  fetchUserProfile,
  fetchUserRepos,
  getFullDashboardData,
  clearGitHubApiCacheForTests,
  GITHUB_CACHE_TTL_MS,
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

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  clearGitHubApiCacheForTests();
});

afterEach(() => {
  clearGitHubApiCacheForTests();
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

    // Make sure the username is wired into the GraphQL variables, not hardcoded.
    const body = JSON.parse(options?.body as string);
    expect(body.variables).toEqual({ login: 'octocat' });
    expect(body.query).toContain('contributionCalendar');
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
      'GitHub GraphQL API returned status 500'
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

    // Only the first error surfaces — the source always reads errors[0].
    await expect(fetchGitHubContributions('octocat')).rejects.toThrow('Bad credentials');
  });

  it('throws a descriptive "user not found" error when the username does not exist on GitHub', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ data: { user: null } }));

    await expect(fetchGitHubContributions('ghost-user-xyz')).rejects.toThrow(
      'GitHub user "ghost-user-xyz" not found'
    );
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
});

describe('getFullDashboardData', () => {
  beforeEach(() => vi.spyOn(global, 'fetch'));
  afterEach(() => vi.restoreAllMocks());

  it('returns full dashboard data correctly', async () => {
    vi.mocked(fetch).mockImplementation(async (url: any) => {
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
  });

  it('throws if any fetch fails', async () => {
    vi.mocked(fetch).mockImplementation(async (url: any) => {
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
    await expect(getFullDashboardData('octocat')).rejects.toThrow('Network error');
  });

  it('throws unknown error for non-error throws', async () => {
    vi.mocked(fetch).mockImplementation(async (url: any) => {
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
    await expect(getFullDashboardData('octocat')).rejects.toThrow('An unknown error occurred');
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
});
