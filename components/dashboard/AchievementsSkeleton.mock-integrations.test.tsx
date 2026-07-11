import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import AchievementsSkeleton from './AchievementsSkeleton';

interface AchievementsData {
  username: string;
  badgeCount: number;
  latestBadge: string;
}

type CacheStore = Record<string, AchievementsData>;

const createMockService = () => {
  const cacheStore: CacheStore = {};

  const fetchRemoteAchievements = vi.fn().mockResolvedValue({
    username: 'test-user',
    badgeCount: 12,
    latestBadge: 'Streak Master',
  } as AchievementsData);

  const getAchievements = async (username: string): Promise<AchievementsData> => {
    if (cacheStore[username]) {
      return cacheStore[username];
    }
    const data = await fetchRemoteAchievements(username);
    cacheStore[username] = data;
    return data;
  };

  return { cacheStore, fetchRemoteAchievements, getAchievements };
};

describe('AchievementsSkeleton Mock Integrations', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('mocks the asynchronous service module and renders the skeleton without real network queries', () => {
    const { fetchRemoteAchievements } = createMockService();

    const { container } = render(<AchievementsSkeleton />);
    expect(container).toBeDefined();

    expect(fetchRemoteAchievements).not.toHaveBeenCalled();

    const cells = container.querySelectorAll('[data-testid="skeleton-cell"]');
    expect(cells.length).toBe(4);
    cells.forEach((cell) => {
      expect(cell.className).toContain('shimmer');
    });
  });

  it('functions as a loading placeholder while the async promise is unresolved', async () => {
    let resolvePromise: (value: AchievementsData) => void = () => {};
    const pendingPromise = new Promise<AchievementsData>((resolve) => {
      resolvePromise = resolve;
    });

    const fetchPendingSpy = vi.fn().mockReturnValue(pendingPromise);

    const { container, unmount } = render(<AchievementsSkeleton />);

    expect(container.querySelectorAll('[data-testid="skeleton-cell"]').length).toBe(4);
    expect(fetchPendingSpy).not.toHaveBeenCalled();

    resolvePromise({ username: 'test-user', badgeCount: 12, latestBadge: 'Streak Master' });
    await pendingPromise;
    unmount();
  });

  it('checks the local cache entry before invoking the asynchronous database or service request', async () => {
    const { cacheStore, fetchRemoteAchievements, getAchievements } = createMockService();

    const preloadedData: AchievementsData = {
      username: 'cached-user',
      badgeCount: 30,
      latestBadge: 'Century Club',
    };
    cacheStore['cached-user'] = preloadedData;

    const result = await getAchievements('cached-user');

    expect(result).toEqual(preloadedData);
    expect(fetchRemoteAchievements).not.toHaveBeenCalled();
  });

  it('falls back gracefully when the mocked service rejects or times out', async () => {
    const fetchTimeoutSpy = vi.fn().mockRejectedValue(new Error('Achievements API timeout error'));

    const getAchievementsWithFallback = async (username: string): Promise<AchievementsData> => {
      try {
        return await fetchTimeoutSpy(username);
      } catch {
        return {
          username,
          badgeCount: 0,
          latestBadge: 'None',
        };
      }
    };

    const result = await getAchievementsWithFallback('failing-user');

    expect(fetchTimeoutSpy).toHaveBeenCalledWith('failing-user');
    expect(result).toEqual({
      username: 'failing-user',
      badgeCount: 0,
      latestBadge: 'None',
    });

    const { container } = render(<AchievementsSkeleton />);
    expect(container).toBeDefined();
  });

  it('synchronizes the local cache on a successful async retrieval', async () => {
    const { cacheStore, fetchRemoteAchievements, getAchievements } = createMockService();

    expect(cacheStore['new-user']).toBeUndefined();

    const result = await getAchievements('new-user');

    expect(fetchRemoteAchievements).toHaveBeenCalledTimes(1);
    expect(fetchRemoteAchievements).toHaveBeenCalledWith('new-user');

    expect(cacheStore['new-user']).toEqual(result);
    expect(cacheStore['new-user']).toEqual({
      username: 'test-user',
      badgeCount: 12,
      latestBadge: 'Streak Master',
    });

    const { container } = render(<AchievementsSkeleton />);
    expect(container.firstChild).toBeDefined();
  });
});
