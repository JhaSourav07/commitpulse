import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { BackgroundRefresh } from './background-refresh';
import { getFullDashboardData } from '../../lib/github';

// Mock the external github fetch integration
vi.mock('../../lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

describe('BackgroundRefresh - Theme Contrast Equivalent (Mode Cohesion)', () => {
  let refresher: BackgroundRefresh;

  beforeEach(() => {
    // Note: since it's a singleton, we use getInstance and reset
    // but the class is exported as a singleton instance 'backgroundRefresh'.
    // We can just import the class and use getInstance.
    refresher = BackgroundRefresh['getInstance']();
    refresher.reset();
    vi.clearAllMocks();
  });

  it('Dual Environment Setup: seamlessly swaps between Fresh (Light) and Stale (Dark) cache modes', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T12:00:00Z').getTime());

    // Fresh Environment (Light Mode equivalent) - Synced 1 minute ago
    const freshTimestamp = new Date('2024-01-01T11:59:00Z').toISOString();
    expect(refresher.isStale(freshTimestamp)).toBe(false);

    // Stale Environment (Dark Mode equivalent) - Synced 15 minutes ago
    const staleTimestamp = new Date('2024-01-01T11:45:00Z').toISOString();
    expect(refresher.isStale(staleTimestamp)).toBe(true);

    vi.restoreAllMocks();
  });

  it('Behavior Adaptation Cohesion: accurately transitions user from Idle to Active Job state', () => {
    // Mock getFullDashboardData to return a promise that doesn't resolve immediately
    let resolveJob: (value?: unknown) => void;
    (getFullDashboardData as Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveJob = resolve;
      })
    );

    // Idle State
    expect(refresher.isJobActive('transition_user')).toBe(false);

    // Trigger action
    refresher.triggerRefresh('transition_user');

    // Active State
    expect(refresher.isJobActive('transition_user')).toBe(true);

    // Cleanup: Resolve the promise to not leave hanging promises
    resolveJob!(undefined);
  });

  it('Contrast Verification (Concurrency): rigidly rejects colliding background jobs to preserve active state contrast', () => {
    let resolveJob1: (value?: unknown) => void;
    (getFullDashboardData as Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveJob1 = resolve;
      })
    );

    // Trigger first job
    refresher.triggerRefresh('collide_user');
    expect(getFullDashboardData).toHaveBeenCalledTimes(1);
    expect(refresher.isJobActive('collide_user')).toBe(true);

    // Attempt to trigger overlapping second job
    refresher.triggerRefresh('collide_user');

    // The integration should NOT be called a second time
    expect(getFullDashboardData).toHaveBeenCalledTimes(1);

    resolveJob1!(undefined);
  });

  it('Configuration Preservation (Error Resilience): clears active state smoothly upon integration failures without getting stuck', async () => {
    // Force a failure
    (getFullDashboardData as Mock).mockReturnValue(Promise.reject(new Error('Network failure')));

    refresher.triggerRefresh('error_user');
    expect(refresher.isJobActive('error_user')).toBe(true);

    // Wait for the microtask queue to process the catch/finally blocks
    await new Promise(process.nextTick);

    // State should have smoothly transitioned back to idle
    expect(refresher.isJobActive('error_user')).toBe(false);
  });

  it('Foreground/Background Cohesion (Sanitization): flawlessly aligns active states across disparate formatting inputs', () => {
    (getFullDashboardData as Mock).mockReturnValue(Promise.resolve());

    // Start job with messy formatting
    refresher.triggerRefresh('   Messy_User   ');

    // Check state with clean formatting
    expect(refresher.isJobActive('messy_user')).toBe(true);

    // Check state with different messy formatting
    expect(refresher.isJobActive('  MESSY_USER ')).toBe(true);
  });
});
