import { beforeEach, describe, expect, it } from 'vitest';
import { RefreshPolicy } from './refresh-policy';

describe('RefreshPolicy - Responsive Breakpoints Layout Cohesion', () => {
  beforeEach(() => {
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));
  });

  it('maintains expected cooldown constraints under simulated mobile viewport dimensions', () => {
    const policy = RefreshPolicy.getInstance();
    policy.reset();

    expect(window.innerWidth).toBe(375);

    const allowed = policy.isRefreshAllowed('mobile-user');
    expect(allowed).toBe(true);

    policy.recordRefresh('mobile-user');
    expect(policy.isRefreshAllowed('mobile-user')).toBe(false);
  });

  it('verifies that resizing viewport does not disrupt existing active cooldown timers', () => {
    const policy = RefreshPolicy.getInstance();
    policy.reset();
    policy.recordRefresh('resizable-user');

    // Verify it is blocked on mobile
    expect(policy.isRefreshAllowed('resizable-user')).toBe(false);

    // Resize viewport to desktop breakpoint
    window.innerWidth = 1440;
    window.dispatchEvent(new Event('resize'));

    // Cooldown state must be preserved
    expect(window.innerWidth).toBe(1440);
    expect(policy.isRefreshAllowed('resizable-user')).toBe(false);
  });

  it('ensures duration limits are independent of window/responsive viewport heights', () => {
    const policy = RefreshPolicy.getInstance();
    policy.reset();
    policy.setCooldown(5000);

    window.innerHeight = 812;
    window.dispatchEvent(new Event('resize'));

    expect(policy.getRemainingCooldown('user-a')).toBe(0);
  });
});
