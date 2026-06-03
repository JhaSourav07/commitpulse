import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { BackgroundRefresh } from './background-refresh';
import { getFullDashboardData } from '../../lib/github';

vi.mock('../../lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

describe('BackgroundRefresh - Error Resilience (Hydration Stability, Exception Safety & Error Fallbacks)', () => {
  let refresher: BackgroundRefresh;

  beforeEach(() => {
    refresher = BackgroundRefresh['getInstance']();
    refresher.reset();
    vi.clearAllMocks();
  });

  it('Exception Safety: does not throw or crash when getFullDashboardData rejects with an unexpected runtime exception', async () => {
    (getFullDashboardData as Mock).mockRejectedValue(
      new Error('Unexpected runtime exception: database connection refused')
    );

    // triggerRefresh must never throw — the error is swallowed internally
    expect(() => refresher.triggerRefresh('crash_user')).not.toThrow();

    // Wait for the microtask queue to settle
    await new Promise(process.nextTick);

    // Active job must be cleared after exception — no stuck state
    expect(refresher.isJobActive('crash_user')).toBe(false);
  });

  it('Error Fallback: logs error to dev-telemetry (console.error) when background refresh fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (getFullDashboardData as Mock).mockRejectedValue(new Error('DB connectivity error'));

    refresher.triggerRefresh('telemetry_user');

    await new Promise(process.nextTick);

    // Verify exception is logged to dev-telemetry tracker appropriately
    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(consoleSpy.mock.calls[0][0]).toContain('[BackgroundRefresh]');
    expect(consoleSpy.mock.calls[0][0]).toContain('telemetry_user');

    consoleSpy.mockRestore();
  });

  it('Hydration Stability: active job set is fully cleared after exception so subsequent refresh attempts are not blocked', async () => {
    (getFullDashboardData as Mock).mockRejectedValueOnce(new Error('First call fails'));

    refresher.triggerRefresh('hydration_user');

    // Job is active during execution
    expect(refresher.isJobActive('hydration_user')).toBe(true);

    await new Promise(process.nextTick);

    // After failure, job must be cleared so a fresh trigger is accepted
    expect(refresher.isJobActive('hydration_user')).toBe(false);

    // Second attempt must be accepted — no stuck/blocked state from prior failure
    (getFullDashboardData as Mock).mockResolvedValueOnce(undefined);
    refresher.triggerRefresh('hydration_user');
    expect(refresher.isJobActive('hydration_user')).toBe(true);

    await new Promise(process.nextTick);
  });

  it('Exception Safety: handles non-Error throws (strings, objects) without crashing', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate a non-Error throw (e.g. a plain string or object)
    (getFullDashboardData as Mock).mockRejectedValue('string error: server anomaly');

    expect(() => refresher.triggerRefresh('non_error_user')).not.toThrow();

    await new Promise(process.nextTick);

    // Job must still be cleared even for non-Error throws
    expect(refresher.isJobActive('non_error_user')).toBe(false);

    // Error must still be logged
    expect(consoleSpy).toHaveBeenCalledOnce();

    consoleSpy.mockRestore();
  });

  it('Error Fallback: reset() provides a clean recovery path clearing all active jobs including stuck ones', async () => {
    // Simulate two concurrent hanging jobs (never resolve)
    (getFullDashboardData as Mock).mockReturnValue(new Promise(() => {}));

    refresher.triggerRefresh('stuck_user_1');
    refresher.triggerRefresh('stuck_user_2');

    expect(refresher.isJobActive('stuck_user_1')).toBe(true);
    expect(refresher.isJobActive('stuck_user_2')).toBe(true);

    // reset() is the user recovery/reload path available on error panels
    refresher.reset();

    // All stuck jobs must be cleared after reset
    expect(refresher.isJobActive('stuck_user_1')).toBe(false);
    expect(refresher.isJobActive('stuck_user_2')).toBe(false);
  });
});
