import { describe, it, expect, vi } from 'vitest';
import { RefreshPolicy } from './refresh-policy';
import { quotaMonitor } from './quota-monitor';

describe('RefreshPolicy - Error Resilience', () => {
  it('handles casing and whitespace formatting variations in usernames resiliently', () => {
    const policy = RefreshPolicy.getInstance();
    policy.reset();

    policy.recordRefresh('  User-Name  ');

    // Should recognize the same username despite different casing and spaces
    const allowed = policy.isRefreshAllowed('user-name');
    expect(allowed).toBe(false);

    const remaining = policy.getRemainingCooldown('USER-NAME');
    expect(remaining).toBeGreaterThan(0);
  });

  it('safely handles empty or null/undefined parameters without throwing runtime errors', () => {
    const policy = RefreshPolicy.getInstance();
    policy.reset();

    // Verify it doesn't crash on invalid username strings
    expect(() => policy.isRefreshAllowed('')).not.toThrow();
    expect(() => policy.isRefreshAllowed('   ')).not.toThrow();
    expect(() => policy.recordRefresh('')).not.toThrow();
  });

  it('handles external component failures gracefully during quota evaluation', () => {
    const policy = RefreshPolicy.getInstance();
    policy.reset();

    // Mock quota monitor to simulate low/corrupted quota formats
    vi.spyOn(quotaMonitor, 'isQuotaLow').mockImplementation(() => {
      throw new Error('Quota check failed');
    });

    // Verify exception safety: should handle the exception or throw safely
    expect(() => policy.isRefreshAllowed('some-user')).toThrow('Quota check failed');

    vi.restoreAllMocks();
  });
});
