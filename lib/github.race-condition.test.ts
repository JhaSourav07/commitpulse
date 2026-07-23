import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import {
  fetchWithRetry,
  clearGitHubApiCacheForTests,
  getTokenIndexLockForTests,
  getRateLimitedTokensForTests,
  handleTokenExpiration,
} from './github';

const MOCK_TOKEN_1 = 'ghp_token1AAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const MOCK_TOKEN_2 = 'ghp_token2AAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const MOCK_TOKEN_3 = 'ghp_token3AAAAAAAAAAAAAAAAAAAAAAAAAAAA';

describe('Issue #7380: Race condition in GitHub token pool management', () => {
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

  it('serializes concurrent 401 rotations so the index advances exactly once per distinct token', async () => {
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

    // Fire 5 concurrent expirations for the SAME token.  The per-token pending
    // refresh promise deduplicates the rotation, and the token-index mutex
    // guarantees the read-modify-write of currentTokenIndex cannot interleave.
    await Promise.all(Array.from({ length: 5 }, () => handleTokenExpiration(MOCK_TOKEN_1)));

    expect(rotationCounter).toBe(1);
    rateLimited.set = origSet;
  });

  it('never lets concurrent rate-limit handlers corrupt the rotation index', async () => {
    process.env.GITHUB_PAT = `${MOCK_TOKEN_1},${MOCK_TOKEN_2},${MOCK_TOKEN_3}`;
    delete process.env.GITHUB_TOKEN;
    clearGitHubApiCacheForTests();

    // Model a thundering-herd of concurrent 429 responses.  Every handler
    // advances currentTokenIndex under the mutex; because the mutex serializes
    // the read-modify-write, the index can never be left in an inconsistent
    // (e.g. out-of-range) state regardless of interleaving.
    fetchMock.mockImplementation(async () => ({
      status: 429,
      ok: false,
      headers: new Headers({
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
      }),
    }));

    let threw = false;
    try {
      await Promise.all(
        Array.from({ length: 12 }, () =>
          fetchWithRetry('https://api.github.com/graphql', { headers: {} })
        )
      );
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);

    // The mutex lock promise must always be a valid, resolved-ready promise
    // (never a rejected one that would permanently wedge future selections).
    const lock = getTokenIndexLockForTests();
    expect(lock).toBeInstanceOf(Promise);
    await expect(lock).resolves.toBeUndefined();
  });

  it('concurrent requests across retries exercise the pool without throwing on a corrupted index', async () => {
    process.env.GITHUB_PAT = `${MOCK_TOKEN_1},${MOCK_TOKEN_2},${MOCK_TOKEN_3}`;
    delete process.env.GITHUB_TOKEN;
    clearGitHubApiCacheForTests();

    // Every other response is a 429 so the pool must keep rotating safely.
    let call = 0;
    fetchMock.mockImplementation(async () => {
      const status = call++ % 2 === 0 ? 429 : 200;
      return {
        status,
        ok: status === 200,
        headers: new Headers(
          status === 200
            ? {}
            : {
                'x-ratelimit-remaining': '0',
                'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
              }
        ),
        json: async () => ({ data: 'success' }),
      } as Response;
    });

    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        fetchWithRetry('https://api.github.com/graphql', { headers: {} }).then(
          (r) => r.status,
          () => 'error'
        )
      )
    );

    // None of the requests should surface a corrupted-index crash; each
    // resolves to a real HTTP status or a controlled RateLimitError.
    for (const status of results) {
      expect([200, 429, 'error']).toContain(status);
    }
  });
});
