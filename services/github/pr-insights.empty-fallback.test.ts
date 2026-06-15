import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPRInsights, type PRInsightData } from './pr-insights';
import { fetchWithRetry } from '@/lib/github';

vi.mock('@/lib/github', () => ({
  fetchWithRetry: vi.fn(),
  getGitHubTokens: vi.fn((): string[] => ['mock-github-token']),
}));

describe('pr-insights empty fallback & edge cases validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Case 1: Supply null or undefined inputs to the insights engine and assert that it returns safe fallback data configurations', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        data: {
          authored: {
            nodes: [
              null,
              undefined,
              {
                id: 'PR_1',
                title: 'PR with null metrics',
                url: 'https://github.com/owner/repo/pull/1',
                state: 'OPEN',
                createdAt: '2026-06-01T10:00:00Z',
                repository: null,
                comments: null,
                reviews: null,
              },
            ],
            pageInfo: null,
          },
          reviewed: null,
        },
      }),
      { status: 200 }
    );

    vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

    const result: PRInsightData = await fetchPRInsights('fallback-user');

    expect(result).toBeDefined();
    expect(result.totalPRs).toBe(1);
    expect(result.repoPerformance[0].name).toBe('Unknown');
    expect(result.reviewsReceived).toBe(0);
    expect(result.highlights.mostDiscussed).toBeUndefined();
  });

  it('Case 2: Provide empty pull request data arrays and verify it generates non-breaking, default summary indicators or error message flags', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        data: {
          authored: {
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
          reviewed: {
            issueCount: 0,
          },
        },
      }),
      { status: 200 }
    );

    vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

    const result: PRInsightData = await fetchPRInsights('empty-user');
    expect(result.mergeRate).toBe(0);
    expect(result.avgCycleTime).toBe(0);
    expect(result.avgReviewTime).toBe(0);
    expect(result.avgTimeToFirstReview).toBe(0);
    expect(result.avgReviewResponseTime).toBe(0);
  });

  it('Case 3: Assert that key structural metrics object properties maintain default state values (e.g., counters at 0, lists empty) in this unconfigured state', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        data: {
          authored: {
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
          reviewed: {
            issueCount: 0,
          },
        },
      }),
      { status: 200 }
    );

    vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

    const result: PRInsightData = await fetchPRInsights('metrics-default-user');
    expect(result.totalPRs).toBe(0);
    expect(result.openPRs).toBe(0);
    expect(result.mergedPRs).toBe(0);
    expect(result.closedPRs).toBe(0);
    expect(result.reviewsGiven).toBe(0);
    expect(result.reviewsReceived).toBe(0);
    expect(result.weeklyActivity).toEqual([]);
    expect(result.monthlyActivity).toEqual([]);
    expect(result.repoPerformance).toEqual([]);
  });

  it('Case 4: Verify that executing calculation loops or loop map reductions on empty datasets completes with zero runtime exceptions', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        data: {
          authored: {
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
          reviewed: {
            issueCount: 0,
          },
        },
      }),
      { status: 200 }
    );

    vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

    await expect(fetchPRInsights('reduction-user')).resolves.not.toThrow();
  });

  it('Case 5: Evaluate the output schema structure to verify that empty placeholder markers or fallback properties exist as expected', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        data: {
          authored: {
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
          reviewed: {
            issueCount: 0,
          },
        },
      }),
      { status: 200 }
    );

    vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

    const result: PRInsightData = await fetchPRInsights('schema-user');

    expect(result).toHaveProperty('totalPRs');
    expect(result).toHaveProperty('openPRs');
    expect(result).toHaveProperty('mergedPRs');
    expect(result).toHaveProperty('closedPRs');
    expect(result).toHaveProperty('mergeRate');
    expect(result).toHaveProperty('avgReviewTime');
    expect(result).toHaveProperty('avgTimeToFirstReview');
    expect(result).toHaveProperty('avgCycleTime');
    expect(result).toHaveProperty('weeklyActivity');
    expect(result).toHaveProperty('monthlyActivity');
    expect(result).toHaveProperty('reviewsGiven');
    expect(result).toHaveProperty('reviewsReceived');
    expect(result).toHaveProperty('avgReviewResponseTime');
    expect(result).toHaveProperty('fastestReview');
    expect(result).toHaveProperty('slowestReview');
    expect(result).toHaveProperty('repoPerformance');
    expect(result).toHaveProperty('highlights');

    expect(Array.isArray(result.weeklyActivity)).toBe(true);
    expect(Array.isArray(result.monthlyActivity)).toBe(true);
    expect(Array.isArray(result.repoPerformance)).toBe(true);
    expect(result.highlights).toBeDefined();
    expect(result.highlights.mostDiscussed).toBeUndefined();
    expect(result.highlights.fastestMerged).toBeUndefined();
    expect(result.highlights.largest).toBeUndefined();
  });
});
