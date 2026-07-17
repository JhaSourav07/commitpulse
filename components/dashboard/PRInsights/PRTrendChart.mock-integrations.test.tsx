// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 'server-only' throws when imported outside Next.js's server-component
// resolution context. It's a no-op marker package in production; stub it
// here so the real pr-insights.ts / lib/cache.ts modules load unmodified.
vi.mock('server-only', () => ({}));

import { fetchPRInsights } from '@/services/github/pr-insights';
import { fetchWithRetry, getGitHubTokens } from '@/lib/github';
import { DistributedCache } from '@/lib/cache';

vi.mock('@/lib/github', () => ({
  fetchWithRetry: vi.fn(),
  getGitHubTokens: vi.fn(),
}));

type GraphQLPRNode = {
  title: string;
  url: string;
  state: 'OPEN' | 'MERGED' | 'CLOSED';
  createdAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  additions: number;
  deletions: number;
  repository: { nameWithOwner: string } | null;
  comments: { totalCount: number } | null;
  reviews: {
    nodes: Array<{ author: { login: string } | null; createdAt: string; state: string }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    totalCount: number;
  } | null;
};

function makeGraphQLResponse(nodes: GraphQLPRNode[], reviewedCount = 0) {
  return {
    ok: true,
    statusText: 'OK',
    json: async () => ({
      data: {
        authored: {
          nodes,
          pageInfo: { hasNextPage: false, endCursor: null },
        },
        reviewed: { issueCount: reviewedCount },
      },
    }),
  };
}

function makePR(overrides: Partial<GraphQLPRNode> = {}): GraphQLPRNode {
  return {
    title: 'Fix bug',
    url: 'https://github.com/acme/widgets/pull/1',
    state: 'MERGED',
    createdAt: '2024-01-01T00:00:00.000Z',
    closedAt: '2024-01-02T00:00:00.000Z',
    mergedAt: '2024-01-02T00:00:00.000Z',
    additions: 10,
    deletions: 2,
    repository: { nameWithOwner: 'acme/widgets' },
    comments: { totalCount: 1 },
    reviews: {
      nodes: [
        { author: { login: 'reviewer' }, createdAt: '2024-01-01T06:00:00.000Z', state: 'APPROVED' },
      ],
      pageInfo: { hasNextPage: false, endCursor: null },
      totalCount: 1,
    },
    ...overrides,
  };
}

describe('pr-insights service — asynchronous service mocking & local cache stubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGitHubTokens).mockReturnValue(['test-token']);
    vi.mocked(fetchWithRetry).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('1. mocks the GitHub GraphQL service and token provider as isolated stubs', async () => {
    vi.mocked(fetchWithRetry).mockResolvedValue(
      makeGraphQLResponse([
        makePR(),
        makePR({ state: 'OPEN', mergedAt: null }),
      ]) as unknown as Response
    );

    const result = await fetchPRInsights('octocat-service-mock');

    expect(fetchWithRetry).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetchWithRetry).mock.calls[0];
    expect(url).toBe('https://api.github.com/graphql');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { Authorization: 'bearer test-token' },
    });

    expect(result.totalPRs).toBe(2);
    expect(result.mergedPRs).toBe(1);
    expect(result.openPRs).toBe(1);
  });

  it('2. queries the local cache before invoking the mocked service and serves cached data thereafter', async () => {
    const getSpy = vi.spyOn(DistributedCache.prototype, 'get');

    vi.mocked(fetchWithRetry).mockResolvedValue(
      makeGraphQLResponse([makePR()]) as unknown as Response
    );

    const first = await fetchPRInsights('octocat-cache-hit');
    const second = await fetchPRInsights('octocat-cache-hit');

    expect(getSpy).toHaveBeenCalled();

    expect(fetchWithRetry).toHaveBeenCalledTimes(1);

    expect(getSpy.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(fetchWithRetry).mock.invocationCallOrder[0]
    );

    expect(second).toEqual(first);
  });

  it('3. deduplicates concurrent calls for the same user via the in-flight request lock', async () => {
    vi.mocked(fetchWithRetry).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(makeGraphQLResponse([makePR()]) as unknown as Response), 10);
        })
    );

    const [first, second] = await Promise.all([
      fetchPRInsights('octocat-concurrent'),
      fetchPRInsights('octocat-concurrent'),
    ]);

    expect(fetchWithRetry).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('4. propagates a simulated endpoint timeout without poisoning the cache, so the next call retries', async () => {
    vi.mocked(fetchWithRetry).mockRejectedValueOnce(new Error('The operation timed out'));

    await expect(fetchPRInsights('octocat-timeout')).rejects.toThrow('The operation timed out');

    vi.mocked(fetchWithRetry).mockResolvedValueOnce(
      makeGraphQLResponse([makePR()]) as unknown as Response
    );

    const result = await fetchPRInsights('octocat-timeout');

    expect(fetchWithRetry).toHaveBeenCalledTimes(2);
    expect(result.totalPRs).toBe(1);
  });

  it('5. writes a complete cache entry after a successful service load', async () => {
    const setSpy = vi.spyOn(DistributedCache.prototype, 'set');
    vi.mocked(fetchWithRetry).mockResolvedValue(
      makeGraphQLResponse([makePR()]) as unknown as Response
    );

    const result = await fetchPRInsights('octocat-cache-write');

    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(setSpy.mock.calls[0][0]).toBe('pr-insights:octocat-cache-write');

    expect(setSpy.mock.calls[0][1]).toEqual(result);
  });
});
