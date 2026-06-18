import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackgroundRefresh } from './background-refresh';
import { getFullDashboardData } from '../../lib/github';

vi.mock('../../lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

describe('BackgroundRefresh Unit Tests', () => {
  let service: BackgroundRefresh;

  beforeEach(() => {
    service = BackgroundRefresh.getInstance();
    service.reset();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('behaves as a singleton and returns the same instance', () => {
    const anotherInstance = BackgroundRefresh.getInstance();
    expect(service).toBe(anotherInstance);
  });

  describe('isStale', () => {
    it('returns true when lastSyncedAt is undefined', () => {
      expect(service.isStale(undefined)).toBe(true);
    });

    it('returns true when lastSyncedAt is an invalid date string', () => {
      expect(service.isStale('invalid-date')).toBe(true);
    });

    it('returns true when lastSyncedAt is older than 10 minutes', () => {
      const now = Date.now();
      const elevenMinutesAgo = new Date(now - 11 * 60 * 1000).toISOString();

      expect(service.isStale(elevenMinutesAgo)).toBe(true);
    });

    it('returns false when lastSyncedAt is within 10 minutes', () => {
      const now = Date.now();
      const nineMinutesAgo = new Date(now - 9 * 60 * 1000).toISOString();

      expect(service.isStale(nineMinutesAgo)).toBe(false);
    });
  });

  describe('triggerRefresh', () => {
    it('sanitizes username (trims and converts to lowercase)', async () => {
      vi.mocked(getFullDashboardData).mockResolvedValue({} as never);

      await service.triggerRefresh('  TestUser  ');

      expect(getFullDashboardData).toHaveBeenCalledWith('  TestUser  ', {
        forceRefresh: true,
      });

      expect(service.isJobActive('testuser')).toBe(false);
    });

    it('prevents concurrent duplicate jobs for the same user', async () => {
      let resolvePromise!: () => void;

      const pendingPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(getFullDashboardData).mockReturnValue(
        pendingPromise as unknown as ReturnType<typeof getFullDashboardData>
      );

      const firstCall = service.triggerRefresh('user1');
      const secondCall = service.triggerRefresh('user1');

      await Promise.resolve();

      expect(service.isJobActive('user1')).toBe(true);
      expect(getFullDashboardData).toHaveBeenCalledTimes(1);

      resolvePromise();

      await firstCall;
      await secondCall;

      expect(service.isJobActive('user1')).toBe(false);
    });

    it('removes the user from active jobs on failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(getFullDashboardData).mockRejectedValue(new Error('Network error'));

      service.triggerRefresh('user-fail');

      expect(service.isJobActive('user-fail')).toBe(true);

      await vi.runAllTimersAsync();

      expect(service.isJobActive('user-fail')).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('handles expired tokens or authentication errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockedApi = vi.mocked(getFullDashboardData);

      const authError = new Error('Bad credentials');

      Object.assign(authError, {
        status: 401,
      });

      mockedApi.mockRejectedValueOnce(authError);

      service.triggerRefresh('invalid_token_user');

      await vi.runAllTimersAsync();

      expect(service.isJobActive('invalid_token_user')).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('recovers correctly from network dropouts during synchronization', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockedApi = vi.mocked(getFullDashboardData);

      mockedApi.mockRejectedValueOnce(new Error('Network timeout'));

      service.triggerRefresh('offline_user');

      expect(service.isJobActive('offline_user')).toBe(true);

      await vi.runAllTimersAsync();

      expect(service.isJobActive('offline_user')).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('reset', () => {
    it('clears all currently active jobs', () => {
      vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {}));

      service.triggerRefresh('active-user');

      expect(service.isJobActive('active-user')).toBe(true);

      service.reset();

      expect(service.isJobActive('active-user')).toBe(false);
    });
  });
});
