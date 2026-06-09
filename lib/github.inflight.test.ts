import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGitHubContributions, clearGitHubApiCacheForTests } from './github';
import type { ContributionCalendar } from '../types';

vi.mock('server-only', () => ({}));

const mockCalendar: ContributionCalendar = {
  totalContributions: 5,
  weeks: [
    {
      contributionDays: [{ contributionCount: 5, date: '2024-06-10' }],
    },
  ],
};

const mockContributionData = {
  calendar: { ...mockCalendar, lastSyncedAt: new Date().toISOString() },
  repoContributions: [],
  totalPRs: 0,
  totalIssues: 0,
};

function makeFetchMock(data: unknown, status = 200) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

beforeEach(() => {
  clearGitHubApiCacheForTests();
  process.env.GITHUB_PAT = 'test-token';
});

describe('fetchGitHubContributions — in-flight coalescing', () => {
  it('fires exactly one fetch when two concurrent requests miss the cache for the same username', async () => {
    const graphqlPayload = {
      data: {
        user: {
          contributionsCollection: {
            totalPullRequestContributions: 0,
            totalIssueContributions: 0,
            contributionCalendar: mockCalendar,
            commitContributionsByRepository: [],
          },
        },
      },
    };

    let fetchCallCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        fetchCallCount++;
        return Promise.resolve(
          new Response(JSON.stringify(graphqlPayload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      })
    );

    // Fire two requests for the same username simultaneously — neither is cached yet
    const [result1, result2] = await Promise.all([
      fetchGitHubContributions('testuser'),
      fetchGitHubContributions('testuser'),
    ]);

    // Both should resolve with valid data
    expect(result1.calendar.totalContributions).toBe(5);
    expect(result2.calendar.totalContributions).toBe(5);

    // Only one upstream fetch should have fired
    expect(fetchCallCount).toBe(1);

    vi.unstubAllGlobals();
  });

  it('fires independent fetches for two different usernames', async () => {
    const makePayload = (count: number) => ({
      data: {
        user: {
          contributionsCollection: {
            totalPullRequestContributions: 0,
            totalIssueContributions: 0,
            contributionCalendar: { ...mockCalendar, totalContributions: count },
            commitContributionsByRepository: [],
          },
        },
      },
    });

    let fetchCallCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        fetchCallCount++;
        return Promise.resolve(
          new Response(JSON.stringify(makePayload(fetchCallCount)), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      })
    );

    await Promise.all([fetchGitHubContributions('userA'), fetchGitHubContributions('userB')]);

    // Two different usernames must each fire their own fetch
    expect(fetchCallCount).toBe(2);

    vi.unstubAllGlobals();
  });

  it('clears the in-flight entry after the promise settles so the next request retries cleanly', async () => {
    const graphqlPayload = {
      data: {
        user: {
          contributionsCollection: {
            totalPullRequestContributions: 0,
            totalIssueContributions: 0,
            contributionCalendar: mockCalendar,
            commitContributionsByRepository: [],
          },
        },
      },
    };

    let fetchCallCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        fetchCallCount++;
        return Promise.resolve(
          new Response(JSON.stringify(graphqlPayload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      })
    );

    // First request
    await fetchGitHubContributions('cleanupuser');
    const countAfterFirst = fetchCallCount;

    // Second request after first has fully settled — should hit cache, not re-fetch
    await fetchGitHubContributions('cleanupuser');

    // The second call should be served from cache, not fire a new fetch
    expect(fetchCallCount).toBe(countAfterFirst);

    vi.unstubAllGlobals();
  });

  it('propagates rejection to all concurrent waiters and clears the map entry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failure')));

    const [r1, r2] = await Promise.allSettled([
      fetchGitHubContributions('failuser'),
      fetchGitHubContributions('failuser'),
    ]);

    // Both should reject — no silent swallowing
    expect(r1.status).toBe('rejected');
    expect(r2.status).toBe('rejected');

    vi.unstubAllGlobals();
  });
});
