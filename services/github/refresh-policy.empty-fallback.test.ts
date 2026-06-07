import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RefreshPolicy } from './refresh-policy';

// Mock the quota monitor to avoid interference
vi.mock('./quota-monitor', () => ({
  quotaMonitor: {
    isQuotaLow: vi.fn(() => false),
    incrementRefreshCount: vi.fn(),
  },
}));

describe('RefreshPolicy - Edge Cases & Empty/Missing Inputs', () => {
  let policy: RefreshPolicy;

  beforeEach(() => {
    policy = RefreshPolicy.getInstance();
    policy.reset();
    vi.clearAllMocks();
  });

  it('Empty/Whitespace Usernames: handles empty and whitespace strings gracefully', () => {
    const emptyUser = '';
    const spaceUser = '   ';

    // Should be allowed initially
    expect(policy.isRefreshAllowed(emptyUser)).toBe(true);
    expect(policy.isRefreshAllowed(spaceUser)).toBe(true);

    // Record refresh
    policy.recordRefresh(emptyUser);

    // Both should now be restricted because '   '.trim() === ''.trim()
    expect(policy.isRefreshAllowed(emptyUser)).toBe(false);
    expect(policy.isRefreshAllowed(spaceUser)).toBe(false);
  });

  it('Negative Cooldown Boundaries: clamps negative cooldown durations to 0', () => {
    policy.setCooldown(-5000); // Should be clamped to 0
    policy.recordRefresh('testuser');

    // Since cooldown is clamped to 0, refresh is immediately allowed again
    expect(policy.isRefreshAllowed('testuser')).toBe(true);
    expect(policy.getRemainingCooldown('testuser')).toBe(0);
  });

  it('Unrecorded Users Fallback: returns safe fallback value (0) for unrecorded users', () => {
    const remaining = policy.getRemainingCooldown('never-seen-before');
    expect(remaining).toBe(0); // Should be exactly 0, not undefined/NaN

    // Ensure we aren't getting false negatives
    expect(policy.isRefreshAllowed('never-seen-before')).toBe(true);
  });

  it('Missing/Undefined Parameters: throws TypeError predictably when passed undefined/null', () => {
    // Bypassing TS to simulate runtime missing parameters in JS environments
    const undefinedUser = undefined as unknown as string;
    const nullUser = null as unknown as string;

    // We expect it to throw because .trim() is called on undefined/null
    expect(() => policy.isRefreshAllowed(undefinedUser)).toThrowError(TypeError);
    expect(() => policy.isRefreshAllowed(nullUser)).toThrowError(TypeError);

    expect(() => policy.recordRefresh(undefinedUser)).toThrowError(TypeError);
    expect(() => policy.getRemainingCooldown(nullUser)).toThrowError(TypeError);
  });

  it('Singleton Reset Stability: clears all state and restores defaults on reset', () => {
    // Change state
    policy.setCooldown(10000);
    policy.recordRefresh('user-a');

    // Verify state was changed
    expect(policy.isRefreshAllowed('user-a')).toBe(false);

    // Reset
    policy.reset();

    // Verify map is completely cleared
    expect(policy.isRefreshAllowed('user-a')).toBe(true);
    expect(policy.getRemainingCooldown('user-a')).toBe(0);

    // Verify cooldown is restored to default (30 * 1000 = 30000ms)
    policy.recordRefresh('user-a');
    // It should be around 30000 right after recording (allow minor execution delay)
    const remaining = policy.getRemainingCooldown('user-a');
    expect(remaining).toBeLessThanOrEqual(30000);
    expect(remaining).toBeGreaterThanOrEqual(29000);
  });
});
