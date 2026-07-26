import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gitHubUserValidator } from './validate-user';
import { fetchUserProfile } from '../../lib/github';
import { TTLCache } from '../../lib/cache';

vi.mock('../../lib/github', () => ({
  fetchUserProfile: vi.fn(),
}));

describe('GitHubUserValidator - Massive Scaling & Cache Behavior', () => {
  beforeEach(() => {
    gitHubUserValidator.reset();
    vi.clearAllMocks();
  });

  it('High-volume validation of thousands of usernames successfully', async () => {
    const VOLUME = 6000; // exceeds TTLCache maxSize of 5000 to exercise eviction

    vi.mocked(fetchUserProfile).mockResolvedValue({} as never);

    const tasks: Promise<boolean>[] = [];
    for (let i = 0; i < VOLUME; i++) {
      tasks.push(gitHubUserValidator.validateUser(`user_${i}`));
    }

    const results = await Promise.all(tasks);
    expect(results.every((r) => r === true)).toBe(true);
    expect(fetchUserProfile).toHaveBeenCalledTimes(VOLUME);

    // Internal cache should not grow beyond its configured max (5000)
    const cacheSize = (gitHubUserValidator as unknown as { cache: TTLCache<boolean> }).cache.size();
    expect(cacheSize).toBeLessThanOrEqual(5000);
  });

  it('Cache effectiveness under repeated requests and username normalization', async () => {
    vi.mocked(fetchUserProfile).mockResolvedValue({} as never);

    const raw = '  MixedCaseUser  ';
    const normalized = 'mixedcaseuser';

    const first = await gitHubUserValidator.validateUser(raw);
    expect(first).toBe(true);
    expect(fetchUserProfile).toHaveBeenCalledTimes(1);

    const second = await gitHubUserValidator.validateUser(normalized);
    expect(second).toBe(true);
    // Normalization (trim + lowercase) should cause cache hit and avoid extra API call
    expect(fetchUserProfile).toHaveBeenCalledTimes(1);

    // Clearing the cache forces another API call
    gitHubUserValidator.reset();
    const third = await gitHubUserValidator.validateUser(normalized);
    expect(third).toBe(true);
    expect(fetchUserProfile).toHaveBeenCalledTimes(2);
  });

  it('Negative-result caching when fetchUserProfile throws "User not found"', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('User not found'));

    const first = await gitHubUserValidator.validateUser('ghost-user');
    expect(first).toBe(false);
    const second = await gitHubUserValidator.validateUser('ghost-user');
    expect(second).toBe(false);

    // Negative result should be cached; only one API call
    expect(fetchUserProfile).toHaveBeenCalledTimes(1);
  });

  it('Large-batch stability with many unique usernames', async () => {
    const VOLUME = 10000;

    vi.mocked(fetchUserProfile).mockResolvedValue({} as never);

    const promises: Promise<boolean>[] = [];
    for (let i = 0; i < VOLUME; i++) {
      promises.push(gitHubUserValidator.validateUser(`batch_user_${i}`));
    }

    const all = await Promise.all(promises);
    expect(all.length).toBe(VOLUME);
    expect(all.every((r) => r === true)).toBe(true);
    expect(fetchUserProfile).toHaveBeenCalledTimes(VOLUME);

    // Ensure the cache remains bounded and stable
    const size = (gitHubUserValidator as unknown as { cache: TTLCache<boolean> }).cache.size();
    expect(size).toBeLessThanOrEqual(5000);
  });

  it('Temporary API failures are NOT cached and trigger repeated API calls', async () => {
    vi.mocked(fetchUserProfile).mockRejectedValue(new Error('GitHub API rate limit exceeded'));

    await expect(gitHubUserValidator.validateUser('octocat')).rejects.toThrow(
      'GitHub API rate limit exceeded'
    );

    await expect(gitHubUserValidator.validateUser('octocat')).rejects.toThrow(
      'GitHub API rate limit exceeded'
    );

    // Each failed attempt should have invoked the API again (no caching of temporary failures)
    expect(fetchUserProfile).toHaveBeenCalledTimes(2);
  });
});
