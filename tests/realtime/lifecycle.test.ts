import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { streamManager } from '@/lib/realtime/streamManager';
import { fetchGitHubContributions } from '@/lib/github';
import { calculateStreak } from '@/lib/calculate';

vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
}));

vi.mock('@/lib/calculate', () => ({
  calculateStreak: vi.fn(),
}));

describe('streamManager lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should register connection and fetch initial contributions', async () => {
    const mockContributions = {
      calendar: {
        totalContributions: 10,
        weeks: [
          {
            contributionDays: [{ date: '2026-07-20', contributionCount: 10 }],
          },
        ],
      },
    };

    vi.mocked(fetchGitHubContributions).mockResolvedValue(
      mockContributions as unknown as ReturnType<typeof fetchGitHubContributions> extends Promise<
        infer U
      >
        ? U
        : never
    );
    vi.mocked(calculateStreak).mockReturnValue({
      currentStreak: 2,
      longestStreak: 5,
      totalContributions: 10,
      todayDate: '2026-07-20',
    });

    const callback = vi.fn();
    streamManager.register('conn-1', 'user1', 30, callback);

    // Should fetch initially
    expect(fetchGitHubContributions).toHaveBeenCalledWith('user1', { bypassCache: true });

    // Advance timers by the duration needed to trigger any pending timeouts/intervals if necessary, or just runOnlyPendingTimersAsync
    await vi.runOnlyPendingTimersAsync();

    expect(callback).toHaveBeenCalledWith('streak_change', {
      username: 'user1',
      currentStreak: 2,
      longestStreak: 5,
      totalContributions: 10,
    });

    streamManager.unregister('conn-1');
  });
});
