import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { fetchWithRetry, getGitHubTokens, clearGitHubApiCacheForTests } from './github';

describe('GitHub Multi-Token Rotation & Fallback', () => {
  const originalGitHubPat = process.env.GITHUB_PAT;
  const originalGitHubToken = process.env.GITHUB_TOKEN;
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    clearGitHubApiCacheForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.GITHUB_PAT = originalGitHubPat;
    process.env.GITHUB_TOKEN = originalGitHubToken;
  });

  it('correctly parses multiple comma-separated tokens', () => {
    process.env.GITHUB_PAT = ' token1, token2,  token3 ';
    delete process.env.GITHUB_TOKEN;

    const tokens = getGitHubTokens();
    expect(tokens).toEqual(['token1', 'token2', 'token3']);
  });

  it('rotates to the next token on HTTP 429 rate limiting', async () => {
    process.env.GITHUB_PAT = 'token1,token2';
    delete process.env.GITHUB_TOKEN;

    // First fetch fails with 429
    fetchMock.mockResolvedValueOnce({
      status: 429,
      ok: false,
      headers: new Headers({
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
      }),
    });

    // Second fetch succeeds with 200
    fetchMock.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Headers(),
      json: async () => ({ data: 'success' }),
    });

    const res = await fetchWithRetry('https://api.github.com/graphql', {
      headers: {},
    });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Verify first request used token1
    const firstCallHeaders = fetchMock.mock.calls[0][1].headers;
    expect(firstCallHeaders.Authorization).toBe('bearer token1');

    // Verify second request rotated to token2
    const secondCallHeaders = fetchMock.mock.calls[1][1].headers;
    expect(secondCallHeaders.Authorization).toBe('bearer token2');
  });

  it('rotates to the next token on HTTP 401 unauthorized and excludes the bad token for 24h', async () => {
    process.env.GITHUB_PAT = 'bad_token,good_token';
    delete process.env.GITHUB_TOKEN;

    // First fetch fails with 401 (Invalid token)
    fetchMock.mockResolvedValueOnce({
      status: 401,
      ok: false,
      headers: new Headers(),
    });

    // Second fetch succeeds with 200
    fetchMock.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Headers(),
      json: async () => ({ data: 'success' }),
    });

    const res = await fetchWithRetry('https://api.github.com/graphql', {
      headers: {},
    });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Verify first request used bad_token
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('bearer bad_token');

    // Verify second request used good_token
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('bearer good_token');

    // Verify a subsequent call still skips bad_token and immediately uses good_token
    fetchMock.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Headers(),
      json: async () => ({ data: 'success2' }),
    });

    const res2 = await fetchWithRetry('https://api.github.com/graphql', {
      headers: {},
    });
    expect(res2.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('bearer good_token');
  });
});
