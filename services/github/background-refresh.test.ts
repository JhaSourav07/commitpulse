import { describe, it, expect, vi, beforeEach } from 'vitest';
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
      const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000).toISOString();
      expect(service.isStale(elevenMinutesAgo)).toBe(true);
    });

    it('returns false when lastSyncedAt is within 10 minutes', () => {
      const nineMinutesAgo = new Date(Date.now() - 9 * 60 * 1000).toISOString();
      expect(service.isStale(nineMinutesAgo)).toBe(false);
    });
  });

  describe('triggerRefresh', () => {
    it('sanitizes username (trims and converts to lowercase) and sets job active', async () => {
      vi.mocked(getFullDashboardData).mockResolvedValue({} as never);

      service.triggerRefresh('  TestUser  ');

      expect(service.isJobActive('testuser')).toBe(true);
      expect(getFullDashboardData).toHaveBeenCalledWith('  TestUser  ', { bypassCache: true });

      // Allow promise microtask to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(service.isJobActive('testuser')).toBe(false);
    });

    it('prevents concurrent duplicate jobs for the same user', () => {
      vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {})); // Never resolves

      service.triggerRefresh('user1');
      service.triggerRefresh('user1');

      expect(service.isJobActive('user1')).toBe(true);
      expect(getFullDashboardData).toHaveBeenCalledTimes(1);
    });

    it('removes the user from active jobs on failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(getFullDashboardData).mockRejectedValue(new Error('Network error'));

      service.triggerRefresh('user-fail');
      expect(service.isJobActive('user-fail')).toBe(true);

      // Allow promise microtask to reject and run finally block
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(service.isJobActive('user-fail')).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('reset', () => {
    it('clears all currently active jobs', () => {
      vi.mocked(getFullDashboardData).mockReturnValue(new Promise(() => {})); // Never resolves
      service.triggerRefresh('active-user');
      expect(service.isJobActive('active-user')).toBe(true);

      service.reset();
      expect(service.isJobActive('active-user')).toBe(false);
    });
  });
});
