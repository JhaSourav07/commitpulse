import { beforeEach, describe, expect, it, vi } from 'vitest';

/* ---------------------------
 * Mocks
 *
 * We mock every async boundary the route depends on so the tests stay
 * hermetic, deterministic, and offline. This mirrors the pattern used in
 * other `*.mock-integrations.test.ts` files across the project.
 * -------------------------- */

vi.mock('@/services/github/pr-insights', () => ({
  fetchPRInsights: vi.fn(),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn(),
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/github', () => ({
  // The route uses isAbortError as a type guard on caught errors.
  isAbortError: vi.fn((error: unknown) => {
    return error instanceof Error && error.name === 'AbortError';
  }),
}));

import { GET } from './route';
import { fetchPRInsights } from '@/services/github/pr-insights';
import { getUserGitHubToken } from '@/lib/githubtoken';
import { RateLimiter } from '@/lib/rate-limit';

const makeRequest = (username = 'octocat') =>
  new Request(`http://localhost:3000/api/pr-insights?username=${username}`);

describe('GET /api/pr-insights - Asynchronous Service Layer Mocking & Local Cache Stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: rate limiter allows the request through so tests can focus on
    // the async service layer behavior rather than throttling logic.
    vi.spyOn(RateLimiter.prototype, 'checkWithResult').mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });

    // Stub the local cache/token lookup so no real filesystem or DB is touched.
    vi.mocked(getUserGitHubToken).mockResolvedValue(undefined as never);
  });

  it('resolves standard async imports and returns data from the mocked PR insights service', async () => {
    const mockInsights = [
      { repo: 'octocat/hello-world', pullRequests: 3, additions: 120, deletions: 40 },
    ];

    vi.mocked(fetchPRInsights).mockResolvedValueOnce(mockInsights as never);

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockInsights);
    // Confirms the async service layer boundary is invoked exactly once with the trimmed username.
    expect(fetchPRInsights).toHaveBeenCalledTimes(1);
    expect(fetchPRInsights).toHaveBeenCalledWith('octocat', undefined, expect.any(AbortSignal));
  });

  it('queries the local token cache before triggering the remote database retrieval', async () => {
    // Assert local cache layer (getUserGitHubToken) runs before the remote fetch.
    const callOrder: string[] = [];

    vi.mocked(getUserGitHubToken).mockImplementationOnce(async () => {
      callOrder.push('token-cache');
      return 'cached-token-abc';
    });

    vi.mocked(fetchPRInsights).mockImplementationOnce(async () => {
      callOrder.push('remote-fetch');
      return [] as never;
    });

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    // Order matters: local cache must resolve before we hit the remote service.
    expect(callOrder).toEqual(['token-cache', 'remote-fetch']);
    // The cached token must be forwarded to the downstream fetch call.
    expect(fetchPRInsights).toHaveBeenCalledWith(
      'octocat',
      'cached-token-abc',
      expect.any(AbortSignal)
    );
  });

  it('falls back to a 504 timeout response when the upstream endpoint aborts', async () => {
    // Simulate the AbortController firing during a fake endpoint timeout block.
    const abortError = new Error('The operation was aborted.');
    abortError.name = 'AbortError';

    vi.mocked(fetchPRInsights).mockRejectedValueOnce(abortError);

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(504);
    expect(body).toEqual({ error: 'Upstream request timed out after 10 seconds.' });
  });

  it('completes the full success callback path and writes the response body from cached data', async () => {
    // Verifies the entire happy path syncs cleanly — from token lookup, through
    // the async service call, to the JSON body finally written on success.
    const cachedPayload = [
      { repo: 'octocat/spoon-knife', pullRequests: 7, additions: 500, deletions: 220 },
      { repo: 'octocat/hello-world', pullRequests: 2, additions: 30, deletions: 10 },
    ];

    vi.mocked(getUserGitHubToken).mockResolvedValueOnce('token-xyz');
    vi.mocked(fetchPRInsights).mockResolvedValueOnce(cachedPayload as never);

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(cachedPayload);
    expect(getUserGitHubToken).toHaveBeenCalledTimes(1);
    expect(fetchPRInsights).toHaveBeenCalledTimes(1);
  });

  it('propagates a 500 error response when the async service layer throws a non-abort error', async () => {
    // Non-abort failures should surface as 500 with the underlying error message.
    vi.mocked(fetchPRInsights).mockRejectedValueOnce(new Error('Database retrieval failed'));

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Database retrieval failed' });
  });
});
