import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { RefreshPolicy } from './refresh-policy';
import { quotaMonitor } from './quota-monitor';

// Mock the quota monitor to control high-contrast "override" states
vi.mock('./quota-monitor', () => ({
  quotaMonitor: {
    isQuotaLow: vi.fn(() => false),
    incrementRefreshCount: vi.fn(),
  },
}));

describe('RefreshPolicy - Theme Contrast Equivalent (Mode Cohesion)', () => {
  let policy: RefreshPolicy;

  beforeEach(() => {
    policy = RefreshPolicy.getInstance();
    policy.reset();
    vi.clearAllMocks();
  });

  it('Dual Environment Setup: seamlessly swaps between standard (light) and aggressive (dark) modes', () => {
    // Light Mode (Standard Cooldown)
    policy.setCooldown(300000);
    expect(policy.getRemainingCooldown('new_user')).toBe(0);

    // Dark Mode (Aggressive Cooldown)
    policy.setCooldown(600000);
    expect(policy.getRemainingCooldown('new_user')).toBe(0);

    // Swap back
    policy.setCooldown(300000);
    expect(policy.getRemainingCooldown('new_user')).toBe(0);
  });

  it('Behavior Adaptation Cohesion: dynamically adapts allow/deny status based on active mode', () => {
    // Record user in Standard Mode (300000ms)
    policy.setCooldown(300000);
    policy.recordRefresh('mode_user');

    // Simulate exactly 400000ms passing by manipulating Date.now
    const originalDateNow = Date.now;
    const futureTime = originalDateNow() + 400000;
    vi.spyOn(Date, 'now').mockReturnValue(futureTime);

    // In Standard Mode, 400000 > 300000, so refresh is allowed
    expect(policy.isRefreshAllowed('mode_user')).toBe(true);

    // Swap to Aggressive Mode (600000ms)
    policy.setCooldown(600000);

    // In Aggressive Mode, 400000 < 600000, so refresh is now denied!
    expect(policy.isRefreshAllowed('mode_user')).toBe(false);

    // Restore
    vi.restoreAllMocks();
  });

  it('Contrast Verification (Overrides): quota lockouts uniformly block across all configuration modes', () => {
    // Activate high-contrast global override
    (quotaMonitor.isQuotaLow as Mock).mockReturnValue(true);

    policy.setCooldown(100);
    expect(policy.isRefreshAllowed('user_1')).toBe(false);

    policy.setCooldown(9999999);
    expect(policy.isRefreshAllowed('user_1')).toBe(false);

    policy.setCooldown(0);
    expect(policy.isRefreshAllowed('user_1')).toBe(false);

    // Deactivate override
    (quotaMonitor.isQuotaLow as Mock).mockReturnValue(false);
  });

  it('Configuration Preservation: swapping modes preserves internal caching data integrity', () => {
    // Record in mode A
    policy.setCooldown(300000);
    policy.recordRefresh('state_user');

    // Check remaining cooldown (should be roughly 300000)
    const remainingA = policy.getRemainingCooldown('state_user');

    // Swap to mode B
    policy.setCooldown(600000);

    // The timestamp state is still intact, just the boundary shifted
    const remainingB = policy.getRemainingCooldown('state_user');

    expect(remainingB).toBeGreaterThan(remainingA);
    // Delta should be exactly 300000
    expect(Math.abs(remainingB - remainingA - 300000)).toBeLessThan(50);
  });

  it('Foreground/Background Cohesion: getRemainingCooldown calculates foreground values flawlessly against active background mode', () => {
    policy.recordRefresh('fg_bg_user');

    // Background Mode 1
    policy.setCooldown(1000);
    const bg1 = policy.getRemainingCooldown('fg_bg_user');
    expect(bg1).toBeGreaterThan(0);
    expect(bg1).toBeLessThanOrEqual(1000);

    // Background Mode 2
    policy.setCooldown(5000);
    const bg2 = policy.getRemainingCooldown('fg_bg_user');
    expect(bg2).toBeGreaterThan(1000);
    expect(bg2).toBeLessThanOrEqual(5000);

    // Background Mode 3 (Disabled)
    policy.setCooldown(0);
    const bg3 = policy.getRemainingCooldown('fg_bg_user');
    expect(bg3).toBe(0);
  });
});
