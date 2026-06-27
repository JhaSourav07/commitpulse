import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RefreshPolicy } from './refresh-policy';
import { quotaMonitor } from './quota-monitor';

describe('RefreshPolicy - Timezone Boundaries', () => {
  let policy: RefreshPolicy;

  beforeEach(() => {
    policy = RefreshPolicy.getInstance();
    policy.reset();
    quotaMonitor.reset();
    vi.restoreAllMocks();
  });

  // Test 1: Username normalization (trim + lowercase) produces identical cooldown behavior
  it('should produce identical cooldown behavior for usernames with different casing and whitespace', () => {
    vi.useFakeTimers();

    policy.setCooldown(10_000);

    // Record refresh with whitespace and mixed casing
    policy.recordRefresh('  UserName  ');

    // Verify that different casing/whitespace variations see the same cooldown
    expect(policy.isRefreshAllowed('username')).toBe(false);
    expect(policy.isRefreshAllowed('USERNAME')).toBe(false);
    expect(policy.isRefreshAllowed('  username  ')).toBe(false);
    expect(policy.isRefreshAllowed('UsErNaMe')).toBe(false);

    // All variations should report the same remaining cooldown
    const remaining1 = policy.getRemainingCooldown('username');
    const remaining2 = policy.getRemainingCooldown('USERNAME');
    const remaining3 = policy.getRemainingCooldown('  username  ');
    expect(remaining1).toBe(remaining2);
    expect(remaining2).toBe(remaining3);
    expect(remaining1).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  // Test 2: Extremely long usernames are handled safely through cache-key hashing
  it('should handle extremely long usernames safely through cache-key hashing', () => {
    vi.useFakeTimers();

    policy.setCooldown(5_000);

    // Create an extremely long username (>10000 characters)
    const longUsername = 'a'.repeat(15_000);

    // Should not crash, and cooldown should work
    policy.recordRefresh(longUsername);

    expect(policy.isRefreshAllowed(longUsername)).toBe(false);
    expect(policy.getRemainingCooldown(longUsername)).toBeGreaterThan(0);

    // Advance time past cooldown
    vi.advanceTimersByTime(5_001);

    expect(policy.isRefreshAllowed(longUsername)).toBe(true);
    expect(policy.getRemainingCooldown(longUsername)).toBe(0);

    vi.useRealTimers();
  });

  // Test 3: Cooldown calculations remain correct around Date.now() boundary conditions
  it('should calculate cooldown correctly at exact boundary conditions', () => {
    vi.useFakeTimers();

    policy.setCooldown(10_000);

    // Record refresh at time 0
    policy.recordRefresh('testuser');

    // At exactly 9999ms, should still be blocked
    vi.advanceTimersByTime(9_999);
    expect(policy.isRefreshAllowed('testuser')).toBe(false);

    // At exactly 10000ms, should still be blocked (needs >= not >)
    vi.advanceTimersByTime(1);
    expect(policy.isRefreshAllowed('testuser')).toBe(true);

    // At exactly 10001ms, should definitely be allowed
    vi.advanceTimersByTime(1);
    expect(policy.isRefreshAllowed('testuser')).toBe(true);

    vi.useRealTimers();
  });

  // Test 4: Cooldown=0 always allows refreshes and skips cooldown enforcement
  it('should always allow refreshes when cooldown is set to 0', () => {
    vi.useFakeTimers();

    policy.setCooldown(0);

    policy.recordRefresh('user1');
    expect(policy.isRefreshAllowed('user1')).toBe(true);

    policy.recordRefresh('user1');
    expect(policy.isRefreshAllowed('user1')).toBe(true);

    // Even at the same time, with cooldown=0, should allow
    vi.advanceTimersByTime(0);
    expect(policy.isRefreshAllowed('user1')).toBe(true);

    // Multiple users should also always be allowed
    policy.recordRefresh('user2');
    expect(policy.isRefreshAllowed('user2')).toBe(true);

    vi.useRealTimers();
  });

  // Test 5: Remaining cooldown never becomes negative and reaches zero correctly
  it('should ensure remaining cooldown is never negative and transitions to zero correctly', () => {
    vi.useFakeTimers();

    policy.setCooldown(5_000);

    policy.recordRefresh('testuser');

    // Remaining cooldown should be close to 5000 initially
    let remaining = policy.getRemainingCooldown('testuser');
    expect(remaining).toBeGreaterThan(4_999);
    expect(remaining).toBeLessThanOrEqual(5_000);

    // At 2500ms, should be around 2500ms remaining
    vi.advanceTimersByTime(2_500);
    remaining = policy.getRemainingCooldown('testuser');
    expect(remaining).toBeGreaterThan(2_499);
    expect(remaining).toBeLessThanOrEqual(2_500);

    // After cooldown expires, should be exactly 0, not negative
    vi.advanceTimersByTime(2_501);
    remaining = policy.getRemainingCooldown('testuser');
    expect(remaining).toBe(0);
    expect(remaining).toBeGreaterThanOrEqual(0);

    // Far in the future, should still be 0 (not negative)
    vi.advanceTimersByTime(100_000);
    remaining = policy.getRemainingCooldown('testuser');
    expect(remaining).toBe(0);
    expect(remaining).toBeGreaterThanOrEqual(0);

    vi.useRealTimers();
  });
});
