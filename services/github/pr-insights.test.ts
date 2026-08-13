import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPRInsights, type PRInsightData } from './pr-insights';
import { fetchWithRetry } from '@/lib/github';

vi.mock('@/lib/github', () => ({
  fetchWithRetry: vi.fn(),
  getGitHubTokens: vi.fn((): string[] => ['mock-github-token']),
}));

describe('fetchPRInsights - avgReviewTime math bug fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly calculates repoPerformance avgReviewTime when self-reviews exist', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        data: {
          authored: {
            nodes: [
              {
                id: 'PR_1',
                title: 'Feature PR',
                url: 'https://github.com/owner/repo1/pull/1',
                state: 'MERGED',
                createdAt: '2026-06-01T10:00:00Z',
                closedAt: '2026-06-01T14:00:00Z',
                mergedAt: '2026-06-01T14:00:00Z',
                additions: 150,
                deletions: 20,
                repository: { nameWithOwner: 'owner/repo1' },
                comments: { totalCount: 2 },
                reviews: {
                  nodes: [
                    // Self review by author -> should be skipped in timing calculation
                    {
                      author: { login: 'test-user' },
                      createdAt: '2026-06-01T10:30:00Z',
                      state: 'COMMENTED',
                    },
                    // Reviewer review 4 hours after creation (2026-06-01T14:00:00Z)
                    {
                      author: { login: 'reviewer-user' },
                      createdAt: '2026-06-01T14:00:00Z',
                      state: 'APPROVED',
                    },
                  ],
                  totalCount: 2,
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
          reviewed: {
            issueCount: 5,
          },
        },
      }),
      { status: 200 }
    );

    vi.mocked(fetchWithRetry).mockResolvedValue(mockResponse);

    const result: PRInsightData = await fetchPRInsights('test-user');

    expect(result.repoPerformance).toHaveLength(1);
    const repo1 = result.repoPerformance[0];
    expect(repo1.name).toBe('owner/repo1');
    expect(repo1.totalPRs).toBe(1);
    expect(repo1.reviewCount).toBe(2);

    // Prior to fix: reviewTimeSum (4h) was divided by reviewCount (2) = 2h (incorrectly deflated by self-review)
    // Post-fix: reviewTimeSum (4h) is divided by validReviewTimesCount (1) = 4h
    expect(repo1.avgReviewTime).toBe(4);
  });

  it('returns avgReviewTime: 0 when a repo has no non-self reviews', async () => {
    const mockResponse = new Response(
      JSON.stringify({
        data: {
          authored: {
            nodes: [
              {
                id: 'PR_2',
                title: 'Solo PR',
                url: 'https://github.com/owner/repo2/pull/2',
                state: 'OPEN',
                createdAt: '2026-06-01T10:00:00Z',
                closedAt: null,
                mergedAt: null,
                additions: 50,
                deletions: 10,
                repository: { nameWithOwner: 'owner/repo2' },
                comments: { totalCount: 0 },
                reviews: {
                  nodes: [
                    {
                      author: { login: 'solo-author' },
                      createdAt: '2026-06-01T11:00:00Z',
                      state: 'COMMENTED',
                    },
                  ],
                  totalCount: 1,
                },
              },
            ],
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

    const result: PRInsightData = await fetchPRInsights('solo-author');

    expect(result.repoPerformance).toHaveLength(1);
    const repo2 = result.repoPerformance[0];
    expect(repo2.name).toBe('owner/repo2');
    expect(repo2.reviewCount).toBe(1);
    expect(repo2.avgReviewTime).toBe(0);
  });
});
