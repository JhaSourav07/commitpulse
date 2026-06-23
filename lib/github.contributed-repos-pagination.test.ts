import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createGraphQLResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
  });
}

async function loadFetchContributedRepos() {
  vi.resetModules();

  const github = await import('./github');

  github.clearGitHubApiCacheForTests();

  return github.fetchContributedRepos;
}

describe('fetchContributedRepos pagination', () => {
  const originalGithubToken = process.env.GITHUB_TOKEN;
  const originalGithubPat = process.env.GITHUB_PAT;

  beforeEach(() => {
    vi.clearAllMocks();

    delete process.env.GITHUB_PAT;
    process.env.GITHUB_TOKEN = 'test-token';

    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();

    if (originalGithubToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalGithubToken;
    }

    if (originalGithubPat === undefined) {
      delete process.env.GITHUB_PAT;
    } else {
      process.env.GITHUB_PAT = originalGithubPat;
    }
  });

  it('fetches contributed repositories across multiple GraphQL pages', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);

    fetchMock
      .mockResolvedValueOnce(
        createGraphQLResponse({
          data: {
            user: {
              repositoriesContributedTo: {
                nodes: Array.from({ length: 100 }, (_, index) => ({
                  name: `repo-${index + 1}`,
                  nameWithOwner: `octo-org/repo-${index + 1}`,
                  owner: { login: 'octo-org' },
                  stargazerCount: index,
                  forkCount: index,
                  primaryLanguage: { name: 'TypeScript' },
                  updatedAt: '2026-06-22T00:00:00Z',
                })),
                pageInfo: {
                  hasNextPage: true,
                  endCursor: 'cursor-page-2',
                },
              },
            },
          },
        })
      )
      .mockResolvedValueOnce(
        createGraphQLResponse({
          data: {
            user: {
              repositoriesContributedTo: {
                nodes: Array.from({ length: 25 }, (_, index) => ({
                  name: `repo-${index + 101}`,
                  nameWithOwner: `octo-org/repo-${index + 101}`,
                  owner: { login: 'octo-org' },
                  stargazerCount: index,
                  forkCount: index,
                  primaryLanguage: { name: 'JavaScript' },
                  updatedAt: '2026-06-22T00:00:00Z',
                })),
                pageInfo: {
                  hasNextPage: false,
                  endCursor: null,
                },
              },
            },
          },
        })
      );

    const fetchContributedRepos = await loadFetchContributedRepos();

    const repos = await fetchContributedRepos('octocat', { bypassCache: true });

    expect(repos).toHaveLength(125);
    expect(repos[0].nameWithOwner).toBe('octo-org/repo-1');
    expect(repos[124].nameWithOwner).toBe('octo-org/repo-125');

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstRequestBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    const secondRequestBody = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);

    expect(firstRequestBody.variables).toEqual({
      login: 'octocat',
      after: null,
    });

    expect(secondRequestBody.variables).toEqual({
      login: 'octocat',
      after: 'cursor-page-2',
    });

    expect(firstRequestBody.query).toContain('after: $after');
    expect(firstRequestBody.query).toContain('pageInfo');
    expect(firstRequestBody.query).toContain('hasNextPage');
    expect(firstRequestBody.query).toContain('endCursor');
  });

  it('stops at the configured contributed repository safety cap', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);

    for (let page = 0; page < 6; page++) {
      fetchMock.mockResolvedValueOnce(
        createGraphQLResponse({
          data: {
            user: {
              repositoriesContributedTo: {
                nodes: Array.from({ length: 100 }, (_, index) => ({
                  name: `repo-${page * 100 + index + 1}`,
                  nameWithOwner: `octo-org/repo-${page * 100 + index + 1}`,
                  owner: { login: 'octo-org' },
                  stargazerCount: index,
                  forkCount: index,
                  primaryLanguage: { name: 'TypeScript' },
                  updatedAt: '2026-06-22T00:00:00Z',
                })),
                pageInfo: {
                  hasNextPage: true,
                  endCursor: `cursor-page-${page + 2}`,
                },
              },
            },
          },
        })
      );
    }

    const fetchContributedRepos = await loadFetchContributedRepos();

    const repos = await fetchContributedRepos('octocat', { bypassCache: true });

    expect(repos).toHaveLength(500);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});
