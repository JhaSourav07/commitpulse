import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackgroundRefresh } from './background-refresh';
import { getFullDashboardData } from '../../lib/github';

vi.mock('../../lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

const mockedGetFullDashboardData = vi.mocked(getFullDashboardData);

describe('BackgroundRefresh empty fallback behavior', () => {
  let service: BackgroundRefresh;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    service = BackgroundRefresh.getInstance();
    service.reset();
    mockedGetFullDashboardData.mockResolvedValue(
      {} as Awaited<ReturnType<typeof getFullDashboardData>>
    );
  });

  afterEach(() => {
    service.reset();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('treats undefined lastSyncedAt as stale fallback state', () => {
    expect(service.isStale(undefined)).toBe(true);
  });

  it('treats empty lastSyncedAt as stale fallback state', () => {
    expect(service.isStale('')).toBe(true);
  });

  it('handles invalid date strings without throwing runtime errors', () => {
    expect(() => service.isStale('not-a-valid-date')).not.toThrow();
    expect(service.isStale('not-a-valid-date')).toBe(true);
  });

  it('handles username with surrounding spaces without creating duplicate jobs', () => {
    service.triggerRefresh('  Mayank200529  ');
    service.triggerRefresh('mayank200529');

    expect(service.isJobActive('mayank200529')).toBe(true);
    expect(mockedGetFullDashboardData).toHaveBeenCalledTimes(1);
    expect(mockedGetFullDashboardData).toHaveBeenCalledWith('  Mayank200529  ', {
      forceRefresh: true,
    });
  });

  it('clears active job fallback state after refresh completes', async () => {
    service.triggerRefresh('mayank200529');

    expect(service.isJobActive('mayank200529')).toBe(true);

    await vi.runAllTimersAsync();

    expect(service.isJobActive('mayank200529')).toBe(false);
  });
});
