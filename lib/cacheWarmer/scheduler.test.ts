import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheWarmerScheduler } from './scheduler';
import * as githubModule from '@/lib/github';
import { profiler } from './profiler';

vi.mock('@/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github')>();
  return {
    ...actual,
    fetchGitHubContributions: vi.fn().mockResolvedValue({
      calendar: {
        totalContributions: 100,
        weeks: [
          {
            contributionDays: [{ contributionCount: 5, date: '2023-01-01' }],
          },
        ],
      },
      repoContributions: [],
    }),
  };
});

describe('CacheWarmerScheduler', () => {
  let scheduler: CacheWarmerScheduler;

  beforeEach(() => {
    scheduler = new CacheWarmerScheduler();
    profiler.clearInMemoryStore();
    vi.clearAllMocks();
  });

  it('warms cache for a single user across specified themes', async () => {
    await scheduler.warmCache('octocat', ['default', 'neon']);

    expect(githubModule.fetchGitHubContributions).toHaveBeenCalledWith('octocat', {
      forceRefresh: true,
    });
  });

  it('runs warmup cycle fetching top users and warming them', async () => {
    await profiler.recordRequest('user1', 100, true);
    await profiler.recordRequest('user2', 120, false);

    const result = await scheduler.runWarmupCycle(10);

    expect(result.warmedCount).toBe(2);
    expect(result.users).toEqual(expect.arrayContaining(['user1', 'user2']));
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
