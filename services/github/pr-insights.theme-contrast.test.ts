import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPRInsights } from './pr-insights';

vi.mock('@/lib/github', () => ({
  fetchWithRetry: vi.fn(),
  getGitHubTokens: vi.fn(() => ['mock-github-token']),
}));

import { fetchWithRetry } from '@/lib/github';

const mockGraphQLResponse = (overrides = {}) => ({
  ok: true,
  status: 200,
  json: () =>
    Promise.resolve({
      data: {
        authored: {
          nodes: [
            {
              id: 'PR_1',
              title: 'Fix login bug',
              url: 'https://github.com/owner/repo/pull/1',
              state: 'MERGED',
              createdAt: '2025-06-01T10:00:00Z',
              mergedAt: '2025-06-01T14:00:00Z',
              additions: 100,
              deletions: 20,
              repository: { nameWithOwner: 'owner/repo' },
              comments: { totalCount: 5 },
              reviews: {
                nodes: [
                  {
                    author: { login: 'reviewer1' },
                    createdAt: '2025-06-01T11:00:00Z',
                    state: 'APPROVED',
                  },
                ],
                pageInfo: { hasNextPage: false, endCursor: null },
                totalCount: 1,
              },
            },
            {
              id: 'PR_2',
              title: 'Add dark mode',
              url: 'https://github.com/owner/repo/pull/2',
              state: 'OPEN',
              createdAt: '2025-06-10T08:00:00Z',
              additions: 50,
              deletions: 10,
              repository: { nameWithOwner: 'owner/repo' },
              comments: { totalCount: 2 },
              reviews: {
                nodes: [],
                pageInfo: { hasNextPage: false, endCursor: null },
                totalCount: 0,
              },
            },
            {
              id: 'PR_3',
              title: 'Refactor utils',
              url: 'https://github.com/other/repo/pull/10',
              state: 'CLOSED',
              createdAt: '2025-05-20T09:00:00Z',
              closedAt: '2025-05-22T09:00:00Z',
              additions: 200,
              deletions: 50,
              repository: { nameWithOwner: 'other/repo' },
              comments: { totalCount: 8 },
              reviews: {
                nodes: [
                  {
                    author: { login: 'reviewer2' },
                    createdAt: '2025-05-21T09:00:00Z',
                    state: 'CHANGES_REQUESTED',
                  },
                  {
                    author: { login: 'reviewer2' },
                    createdAt: '2025-05-21T10:00:00Z',
                    state: 'APPROVED',
                  },
                ],
                pageInfo: { hasNextPage: false, endCursor: null },
                totalCount: 2,
              },
            },
          ],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
        reviewed: { issueCount: 5 },
      },
      ...overrides,
    }),
});

describe('pr-insights - Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchPRInsights parses GraphQL response into structured PRInsightData with correct counts', async () => {
    vi.mocked(fetchWithRetry).mockResolvedValue(mockGraphQLResponse() as unknown as Response);

    const result = await fetchPRInsights('octocat');

    expect(result.totalPRs).toBe(3);
    expect(result.openPRs).toBe(1);
    expect(result.mergedPRs).toBe(1);
    expect(result.closedPRs).toBe(1);
    expect(result.mergeRate).toBeCloseTo(33.33, 1);
    expect(result.reviewsGiven).toBe(5);
    expect(result.reviewsReceived).toBe(3);
  });

  it('caches the result so a second call for the same user does not re-fetch', async () => {
    vi.mocked(fetchWithRetry).mockResolvedValue(mockGraphQLResponse() as unknown as Response);

    await fetchPRInsights('cached-user');
    await fetchPRInsights('cached-user');

    expect(fetchWithRetry).toHaveBeenCalledTimes(1);
  });

  it('handles a user with zero PRs and returns empty aggregated data', async () => {
    vi.mocked(fetchWithRetry).mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            authored: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } },
            reviewed: { issueCount: 0 },
          },
        }),
    } as unknown as Response);

    const result = await fetchPRInsights('new-user');

    expect(result.totalPRs).toBe(0);
    expect(result.openPRs).toBe(0);
    expect(result.mergedPRs).toBe(0);
    expect(result.closedPRs).toBe(0);
    expect(result.mergeRate).toBe(0);
    expect(result.reviewsGiven).toBe(0);
    expect(result.reviewsReceived).toBe(0);
    expect(result.highlights.mostDiscussed).toBeUndefined();
    expect(result.highlights.fastestMerged).toBeUndefined();
  });

  it('propagates a GitHub API error response as a rejected promise', async () => {
    vi.mocked(fetchWithRetry).mockRejectedValue(new Error('GraphQL Error: rate limit exceeded'));

    await expect(fetchPRInsights('error-user')).rejects.toThrow('rate limit exceeded');
  });

  it('computes merge rate, cycle time, and review velocity across PRs with varied states', async () => {
    vi.mocked(fetchWithRetry).mockResolvedValue(mockGraphQLResponse() as unknown as Response);

    const result = await fetchPRInsights('velocity-user');

    expect(result.avgCycleTime).toBeGreaterThan(0);
    expect(result.avgReviewTime).toBeGreaterThan(0);
    expect(result.avgTimeToFirstReview).toBeGreaterThan(0);
    expect(result.fastestReview).toBeGreaterThan(0);
    expect(result.slowestReview).toBeGreaterThan(0);

    expect(result.highlights.fastestMerged).toBeDefined();
    expect(result.highlights.fastestMerged!.title).toBe('Fix login bug');

    expect(result.highlights.mostDiscussed).toBeDefined();
    expect(result.highlights.mostDiscussed!.comments).toBe(8);

    expect(result.repoPerformance).toHaveLength(2);
    expect(result.repoPerformance[0].name).toBe('owner/repo');
    expect(result.repoPerformance[0].totalPRs).toBe(2);
  });
});
