import { describe, it, expect, beforeEach } from 'vitest';
import { PopularUserProfiler } from './profiler';

describe('PopularUserProfiler', () => {
  let profiler: PopularUserProfiler;

  beforeEach(() => {
    profiler = new PopularUserProfiler();
    profiler.clearInMemoryStore();
  });

  it('records request metrics in-memory correctly', async () => {
    await profiler.recordRequest('octocat', 150, true);
    await profiler.recordRequest('octocat', 250, false);

    const topUsers = await profiler.getTopUsers(10);
    expect(topUsers).toHaveLength(1);
    expect(topUsers[0].username).toBe('octocat');
    expect(topUsers[0].requestFrequency).toBeGreaterThan(0);
    expect(topUsers[0].averageLatency).toBe(200);
    expect(topUsers[0].cacheHits).toBe(1);
    expect(topUsers[0].cacheMisses).toBe(1);
  });

  it('ranks users based on weighted trending score', async () => {
    // High frequency user
    await profiler.recordRequest('user-active', 100, true);
    await profiler.recordRequest('user-active', 100, true);
    await profiler.recordRequest('user-active', 100, true);

    // Low frequency user
    await profiler.recordRequest('user-quiet', 100, true);

    const topUsers = await profiler.getTopUsers(10);
    expect(topUsers).toHaveLength(2);
    expect(topUsers[0].username).toBe('user-active');
    expect(topUsers[1].username).toBe('user-quiet');
    expect(topUsers[0].trendingScore).toBeGreaterThan(topUsers[1].trendingScore);
  });

  it('handles empty metrics gracefully', async () => {
    const topUsers = await profiler.getTopUsers(10);
    expect(topUsers).toEqual([]);
  });

  it('trims and lowercases usernames', async () => {
    await profiler.recordRequest('  OctoCat ', 100, true);

    const topUsers = await profiler.getTopUsers(10);
    expect(topUsers[0].username).toBe('octocat');
  });
});
