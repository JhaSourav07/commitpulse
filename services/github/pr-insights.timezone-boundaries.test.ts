import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { fetchPRInsights } from './pr-insights';

describe('[Bug fix] pr-insights month/week bucketing — server-timezone independence', () => {
  const originalTZ = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = 'Europe/Berlin'; // positive UTC offset
  });

  afterAll(() => {
    process.env.TZ = originalTZ;
    vi.restoreAllMocks();
  });

  it('a PR created at 2025-12-31T23:30:00Z is bucketed into December 2025, not January 2026', async () => {
    // 1. Mock the exact PRNode structure expected by pr-insights.ts
    const mockPRNode = {
      id: 'PR_123',
      title: 'Test PR',
      url: 'https://github.com/octocat/test/pull/1',
      state: 'MERGED',
      createdAt: '2025-12-31T23:30:00Z',
      closedAt: '2026-01-01T10:00:00Z',
      mergedAt: '2026-01-01T10:00:00Z',
      additions: 100,
      deletions: 50,
      repository: { nameWithOwner: 'octocat/test-repo' },
      comments: { totalCount: 2 },
      reviews: { nodes: [], totalCount: 0 },
    };

    // 2. Mock global fetch with the exact GraphQL aliases ("authored" and "reviewed")
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers({
        'x-ratelimit-remaining': '4999',
        'x-ratelimit-reset': '1700000000',
      }),
      json: async () => ({
        data: {
          authored: {
            nodes: [mockPRNode],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
          reviewed: {
            issueCount: 0,
          },
        },
      }),
    } as unknown as Response);

    // 3. Call the actual function
    const result = await fetchPRInsights('octocat');

    // 4. Assert the bucketing logic worked independently of the Berlin timezone
    const monthlyKeys = result.monthlyActivity.map((m: { name: string; prs: number }) => m.name);

    expect(monthlyKeys).toContain('2025-12');
    expect(monthlyKeys).not.toContain('2026-01');
  });
});
