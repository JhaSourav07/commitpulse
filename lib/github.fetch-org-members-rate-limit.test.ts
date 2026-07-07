import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createGitHubResponse(
  status: number,
  headers: Record<string, string> = {},
  body: unknown = { message: 'GitHub API error' }
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

async function loadFetchOrgMembers() {
  vi.resetModules();

  const github = await import('./github');

  github.clearGitHubApiCacheForTests();

  return github.fetchOrgMembers;
}

describe('fetchOrgMembers rate limit handling', () => {
  const originalGithubToken = process.env.GITHUB_TOKEN;
  const originalGithubPat = process.env.GITHUB_PAT;

  beforeEach(() => {
    vi.clearAllMocks();

    delete process.env.GITHUB_PAT;
    process.env.GITHUB_TOKEN = 'ghp_testTokenAAAAAAAAAAAAAAAAAAAAAAAA';

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

  it('throws a rate-limit error when org members request exhausts GitHub quota', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);

    fetchMock.mockResolvedValue(
      createGitHubResponse(403, {
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': '1893456000',
        'retry-after': '10',
      })
    );

    const fetchOrgMembers = await loadFetchOrgMembers();

    await expect(fetchOrgMembers('octo-org')).rejects.toThrow(/rate limit/i);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws a rate-limit error when org members request receives 429', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);

    fetchMock.mockResolvedValue(
      createGitHubResponse(429, {
        'retry-after': '10',
      })
    );

    const fetchOrgMembers = await loadFetchOrgMembers();

    await expect(fetchOrgMembers('octo-org')).rejects.toThrow(/rate limit/i);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('preserves the generic org members error for non-rate-limited failures', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);

    fetchMock.mockResolvedValue(createGitHubResponse(500));

    const fetchOrgMembers = await loadFetchOrgMembers();

    await expect(fetchOrgMembers('octo-org')).rejects.toThrow(
      'Failed to fetch members for org octo-org'
    );

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
