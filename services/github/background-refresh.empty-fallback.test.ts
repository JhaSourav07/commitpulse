import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { BackgroundRefresh } from './background-refresh';
import { getFullDashboardData } from '../../lib/github';

vi.mock('../../lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

describe('BackgroundRefresh - Empty & Missing Input Verification', () => {
  let refresher: BackgroundRefresh;

  beforeEach(() => {
    refresher = BackgroundRefresh.getInstance();
    refresher.reset();
    vi.clearAllMocks();
  });

  it('returns true when lastSyncedAt is undefined', () => {
    expect(refresher.isStale(undefined)).toBe(true);
  });

  it('returns true when lastSyncedAt is an empty string', () => {
    expect(refresher.isStale('')).toBe(true);
  });

  it('returns true when lastSyncedAt is null-like invalid input', () => {
    expect(refresher.isStale('null')).toBe(true);
  });

  it('handles username containing only spaces without throwing', async () => {
    (getFullDashboardData as Mock).mockResolvedValue(undefined);

    expect(() => refresher.triggerRefresh('   ')).not.toThrow();

    await new Promise(process.nextTick);

    expect(refresher.isJobActive('   ')).toBe(false);
  });

  it('maintains stable fallback behavior after reset with no active jobs', () => {
    expect(() => refresher.reset()).not.toThrow();
    expect(refresher.isJobActive('missing-user')).toBe(false);
  });
});
