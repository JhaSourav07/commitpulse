import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import {
  fetchWithRetry,
  getGitHubTokens,
  clearGitHubApiCacheForTests,
  getTokenStatsForTests,
  getGlobalCircuitBreakerOpenUntilForTests,
  handleTokenExpiration,
  getRateLimitedTokensForTests,
} from './github';
import { encryptGitHubToken } from './github-token-encryption';

const MOCK_TOKEN_1 = 'ghp_token1AAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const MOCK_TOKEN_2 = 'ghp_token2AAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const MOCK_TOKEN_3 = 'ghp_token3AAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const MOCK_BAD_TOKEN = 'ghp_badtokenAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const MOCK_GOOD_TOKEN = 'ghp_goodtokenAAAAAAAAAAAAAAAAAAAAAAAAAAA';

function getAuthorizationHeader(headers: unknown): string | null {
  return new Headers(headers as HeadersInit | undefined).get('authorization');
}

describe('GitHub Multi-Token Rotation & Fallback', () => {
  const originalGitHubPat = process.env.GITHUB_PAT;
  const originalGitHubToken = process.env.GITHUB_TOKEN;
  const originalGitHubTokens = process.env.GITHUB_TOKENS;
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    clearGitHubApiCacheForTests();
    delete process.env.GITHUB_PAT;
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKENS;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.GITHUB_PAT = originalGitHubPat;
    process.env.GITHUB_TOKEN = originalGitHubToken;
    process.env.GITHUB_TOKENS = originalGitHubTokens;
  });

  it('correctly parses multiple comma-separated tokens', () => {
    process.env.GITHUB_PAT = ` ${MOCK_TOKEN_1}, ${MOCK_TOKEN_2},  ${MOCK_TOKEN_3} `;
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKENS;

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

    const firstCallHeaders = getAuthorizationHeader(fetchMock.mock.calls[0][1]?.headers);
    expect(firstCallHeaders?.match(/^bearer\s+/i)).toBeTruthy();
    expect(firstCallHeaders?.replace(/^bearer\s+/i, '')).toBe(MOCK_TOKEN_1);

    const secondCallHeaders = getAuthorizationHeader(fetchMock.mock.calls[1][1]?.headers);
    expect(secondCallHeaders?.match(/^bearer\s+/i)).toBeTruthy();
    expect(secondCallHeaders?.replace(/^bearer\s+/i, '')).toBe(MOCK_TOKEN_2);
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
    const firstAuthHeader = getAuthorizationHeader(fetchMock.mock.calls[0][1]?.headers);
    expect(firstAuthHeader?.match(/^bearer\s+/i)).toBeTruthy();
    expect(firstAuthHeader?.replace(/^bearer\s+/i, '')).toBe(MOCK_BAD_TOKEN);

    const secondAuthHeader = getAuthorizationHeader(fetchMock.mock.calls[1][1]?.headers);
    expect(secondAuthHeader?.match(/^bearer\s+/i)).toBeTruthy();
    expect(secondAuthHeader?.replace(/^bearer\s+/i, '')).toBe(MOCK_GOOD_TOKEN);

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
    const retryAuthHeader = getAuthorizationHeader(fetchMock.mock.calls[2][1]?.headers);
    expect(retryAuthHeader?.match(/^bearer\s+/i)).toBeTruthy();
    expect(retryAuthHeader?.replace(/^bearer\s+/i, '')).toBe(MOCK_GOOD_TOKEN);
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
    const firstQuotaAuthHeader = getAuthorizationHeader(fetchMock.mock.calls[0][1]?.headers);
    expect(firstQuotaAuthHeader?.match(/^bearer\s+/i)).toBeTruthy();
    expect(firstQuotaAuthHeader?.replace(/^bearer\s+/i, '')).toBe(MOCK_TOKEN_1);

    const secondQuotaAuthHeader = getAuthorizationHeader(fetchMock.mock.calls[1][1]?.headers);
    expect(secondQuotaAuthHeader?.match(/^bearer\s+/i)).toBeTruthy();
    expect(secondQuotaAuthHeader?.replace(/^bearer\s+/i, '')).toBe(MOCK_TOKEN_2);

    const thirdQuotaAuthHeader = getAuthorizationHeader(fetchMock.mock.calls[2][1]?.headers);
    expect(thirdQuotaAuthHeader?.match(/^bearer\s+/i)).toBeTruthy();
    expect(thirdQuotaAuthHeader?.replace(/^bearer\s+/i, '')).toBe(MOCK_TOKEN_2);
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

  it('decrypts encrypted tokens if GITHUB_TOKEN_ENCRYPTION_KEY is present', () => {
    const validKey = 'a'.repeat(32);
    const originalKey = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = validKey;

    try {
      const rawToken = 'ghp_myRealGitHubTokenAAAAAAAAAAAAAAAA';
      const encrypted = encryptGitHubToken(rawToken);

      expect(encrypted).toContain('.');
      expect(encrypted.split('.')).toHaveLength(4);

      const plaintextToken = 'ghp_anotherPlaintextTokenAAAAAAAAAAAA';
      process.env.GITHUB_PAT = `${encrypted}, ${plaintextToken}`;
      delete process.env.GITHUB_TOKEN;

      const tokens = getGitHubTokens();
      expect(tokens).toEqual([rawToken, plaintextToken]);
    } finally {
      process.env.GITHUB_TOKEN_ENCRYPTION_KEY = originalKey;
    }
  });

  it('gracefully falls back to raw token on decryption failure', () => {
    const originalKey = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY = 'a'.repeat(32);

    try {
      const rawToken = 'ghp_plaintextFallbackTokenAAAAAAAAAAAAAAAAAA';
      process.env.GITHUB_PAT = rawToken;
      delete process.env.GITHUB_TOKEN;

      const tokens = getGitHubTokens();
      expect(tokens).toEqual([rawToken]);
    } finally {
      process.env.GITHUB_TOKEN_ENCRYPTION_KEY = originalKey;
    }
  });

  it('discards an undecryptable token instead of forwarding a malformed credential', () => {
    const originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = 'abcdefghijklmnopqrstuvwxyz123456';

    try {
      const fakeEncryptedToken = 'YWJj.ZGVm.YWJj.';

      process.env.GITHUB_PAT = fakeEncryptedToken;
      delete process.env.GITHUB_TOKEN;

      // The token fails to decrypt and the raw ciphertext does not match a
      // valid GitHub token format either, so it must be dropped rather than
      // sent to the API where it would only produce a cryptic 401.
      const tokens = getGitHubTokens();
      expect(tokens).toEqual([]);
    } finally {
      process.env.GITHUB_TOKEN_ENCRYPTION_KEY = originalKey;
    }
  });

  it('deduplicates concurrent 401 rotations using the pending refresh promise pattern (Issue #7213)', async () => {
    process.env.GITHUB_PAT = `${MOCK_BAD_TOKEN},${MOCK_GOOD_TOKEN}`;
    delete process.env.GITHUB_TOKEN;
    clearGitHubApiCacheForTests();

    // Two concurrent requests, each needs:
    //   1st fetch with bad token -> 401
    //   2nd fetch (retry) with good token -> 200
    const mkResponse = (status: number) => ({
      status,
      ok: status === 200,
      headers: new Headers(),
      json: async () => ({ data: 'success' }),
    });

    fetchMock
      .mockResolvedValueOnce(mkResponse(401)) // req1 attempt1
      .mockResolvedValueOnce(mkResponse(401)) // req2 attempt1
      .mockResolvedValueOnce(mkResponse(200)) // req1 retry
      .mockResolvedValueOnce(mkResponse(200)); // req2 retry

    const [res1, res2] = await Promise.all([
      fetchWithRetry('https://api.github.com/graphql', { headers: {} }),
      fetchWithRetry('https://api.github.com/graphql', { headers: {} }),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const authHeaders = fetchMock.mock.calls
      .map((c) => getAuthorizationHeader(c[1]?.headers))
      .filter(Boolean)
      .map((h) => h!.replace(/^bearer\s+/i, ''));

    const goodTokenUsages = authHeaders.filter((h) => h === MOCK_GOOD_TOKEN).length;

    const badTokenUsages = authHeaders.filter((h) => h === MOCK_BAD_TOKEN).length;

    // Both started with the bad token
    expect(badTokenUsages).toBe(2);
    // Both retried with the good token
    expect(goodTokenUsages).toBe(2);
  });

  it('awaiting handleTokenExpiration concurrently only runs rotation once (Issue #7213)', async () => {
    process.env.GITHUB_PAT = `${MOCK_TOKEN_1},${MOCK_TOKEN_2}`;
    delete process.env.GITHUB_TOKEN;
    clearGitHubApiCacheForTests();

    const rateLimited = getRateLimitedTokensForTests();
    let rotationCounter = 0;
    const origSet = rateLimited.set.bind(rateLimited);
    rateLimited.set = function (key: string, value: number) {
      if (key === MOCK_TOKEN_1) {
        rotationCounter++;
      }
      return origSet(key, value);
    };

    await Promise.all([
      handleTokenExpiration(MOCK_TOKEN_1),
      handleTokenExpiration(MOCK_TOKEN_1),
      handleTokenExpiration(MOCK_TOKEN_1),
    ]);

    expect(rotationCounter).toBe(1);

    rateLimited.set = origSet;
  });
});
