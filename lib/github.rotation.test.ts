import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import {
  fetchWithRetry,
  getGitHubTokens,
  clearGitHubApiCacheForTests,
  getTokenStatsForTests,
  getGlobalCircuitBreakerOpenUntilForTests,
} from './github';
import { encryptGitHubToken } from './github-token-encryption';

const MOCK_TOKEN_1 = 'ghp_token1AAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const MOCK_TOKEN_2 = 'ghp_token2AAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const MOCK_TOKEN_3 = 'ghp_token3AAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const MOCK_BAD_TOKEN = 'ghp_badtokenAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const MOCK_GOOD_TOKEN = 'ghp_goodtokenAAAAAAAAAAAAAAAAAAAAAAAAAAA';

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
    process.env.GITHUB_PAT = ` ${MOCK_TOKEN_1}, ${MOCK_TOKEN_2},  ${MOCK_TOKEN_3} `;
    delete process.env.GITHUB_TOKEN;

    const tokens = getGitHubTokens();
    expect(tokens).toEqual([MOCK_TOKEN_1, MOCK_TOKEN_2, MOCK_TOKEN_3]);
  });

  it('rotates to the next token on HTTP 429 rate limiting', async () => {
    process.env.GITHUB_PAT = `${MOCK_TOKEN_1},${MOCK_TOKEN_2}`;
    delete process.env.GITHUB_TOKEN;

    fetchMock.mockResolvedValueOnce({
      status: 429,
      ok: false,
      headers: new Headers({
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
      }),
    });

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

    const firstCallHeaders = fetchMock.mock.calls[0][1].headers;
    expect(firstCallHeaders.Authorization).toBe(`bearer ${MOCK_TOKEN_1}`);

    const secondCallHeaders = fetchMock.mock.calls[1][1].headers;
    expect(secondCallHeaders.Authorization).toBe(`bearer ${MOCK_TOKEN_2}`);
  });

  it('rotates to the next token on HTTP 401 unauthorized and excludes the bad token for 24h', async () => {
    process.env.GITHUB_PAT = `${MOCK_BAD_TOKEN},${MOCK_GOOD_TOKEN}`;
    delete process.env.GITHUB_TOKEN;

    fetchMock.mockResolvedValueOnce({
      status: 401,
      ok: false,
      headers: new Headers(),
    });

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
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(`bearer ${MOCK_BAD_TOKEN}`);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe(`bearer ${MOCK_GOOD_TOKEN}`);

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
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(`bearer ${MOCK_GOOD_TOKEN}`);
  });

  it('prioritizes token with highest remaining quota', async () => {
    process.env.GITHUB_PAT = `${MOCK_TOKEN_1},${MOCK_TOKEN_2}`;
    delete process.env.GITHUB_TOKEN;

    fetchMock.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Headers({
        'x-ratelimit-remaining': '10',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
      }),
      json: async () => ({ data: 'res1' }),
    });

    fetchMock.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Headers({
        'x-ratelimit-remaining': '100',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
      }),
      json: async () => ({ data: 'res2' }),
    });

    fetchMock.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Headers({
        'x-ratelimit-remaining': '99',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
      }),
      json: async () => ({ data: 'res3' }),
    });

    await fetchWithRetry('https://api.github.com/graphql', { headers: {} });
    await fetchWithRetry('https://api.github.com/graphql', { headers: {} });
    await fetchWithRetry('https://api.github.com/graphql', { headers: {} });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(`bearer ${MOCK_TOKEN_1}`);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe(`bearer ${MOCK_TOKEN_2}`);
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(`bearer ${MOCK_TOKEN_2}`);
  });

  it('correctly sets global circuit breaker to the earliest reset time when all tokens are rate-limited', async () => {
    process.env.GITHUB_PAT = `${MOCK_TOKEN_1},${MOCK_TOKEN_2}`;
    delete process.env.GITHUB_TOKEN;

    const resetTime1 = Date.now() + 5000;
    const resetTime2 = Date.now() + 10000;

    const tokenStats = getTokenStatsForTests();
    tokenStats.set(MOCK_TOKEN_1, { remaining: 0, resetTime: resetTime1 });
    tokenStats.set(MOCK_TOKEN_2, { remaining: 0, resetTime: resetTime2 });

    await expect(fetchWithRetry('https://api.github.com/graphql', { headers: {} })).rejects.toThrow(
      'API Rate Limit Exceeded'
    );

    expect(getGlobalCircuitBreakerOpenUntilForTests()).toBe(resetTime1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('decrypts encrypted tokens if ENCRYPTION_KEY is present', () => {
    const originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = 'abcdefghijklmnopqrstuvwxyz123456';

    try {
      const rawToken = 'ghp_myRealGitHubTokenAAAAAAAAAAAAAAAA';
      const encrypted = encryptGitHubToken(rawToken);

      expect(encrypted.split('.')).toHaveLength(4);

      const plaintextToken = 'ghp_anotherPlaintextTokenAAAAAAAAAAAA';
      process.env.GITHUB_PAT = `${encrypted}, ${plaintextToken}`;
      delete process.env.GITHUB_TOKEN;

      const tokens = getGitHubTokens();
      expect(tokens).toEqual([rawToken, plaintextToken]);
    } finally {
      process.env.ENCRYPTION_KEY = originalKey;
    }
  });

  it('discards an undecryptable token instead of forwarding a malformed credential', () => {
    const originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = 'abcdefghijklmnopqrstuvwxyz123456';

    try {
      const fakeEncryptedToken = '1234567890abcdef1234567890abcdef:abcdefabcdef';
      process.env.GITHUB_PAT = fakeEncryptedToken;
      delete process.env.GITHUB_TOKEN;

      // The token fails to decrypt and the raw ciphertext does not match a
      // valid GitHub token format either, so it must be dropped rather than
      // sent to the API where it would only produce a cryptic 401.
      const tokens = getGitHubTokens();
      expect(tokens).toEqual([]);
    } finally {
      process.env.ENCRYPTION_KEY = originalKey;
    }
  });
});
