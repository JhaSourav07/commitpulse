import { beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshPolicy } from './refresh-policy';
import { quotaMonitor } from './quota-monitor';

describe('RefreshPolicy', () => {
  beforeEach(() => {
    refreshPolicy.reset();
    quotaMonitor.reset();

    vi.restoreAllMocks();
  });

  it('allows refresh for a user with no previous refresh history', () => {
    expect(refreshPolicy.isRefreshAllowed('kanishka')).toBe(true);
  });

  it('blocks refresh during cooldown period', () => {
    refreshPolicy.setCooldown(60_000);

    refreshPolicy.recordRefresh('kanishka');

    expect(refreshPolicy.isRefreshAllowed('kanishka')).toBe(false);
  });

  it('allows refresh again after cooldown expires', () => {
    vi.useFakeTimers();

    refreshPolicy.setCooldown(60_000);

    refreshPolicy.recordRefresh('kanishka');

    vi.advanceTimersByTime(60_001);

    expect(refreshPolicy.isRefreshAllowed('kanishka')).toBe(true);

    vi.useRealTimers();
  });

  it('returns remaining cooldown time correctly', () => {
    vi.useFakeTimers();

    refreshPolicy.setCooldown(60_000);

    refreshPolicy.recordRefresh('kanishka');

    vi.advanceTimersByTime(20_000);

    expect(refreshPolicy.getRemainingCooldown('kanishka')).toBe(40_000);

    vi.useRealTimers();
  });

  it('blocks refresh when GitHub quota is low', () => {
    quotaMonitor.setQuota(
      5000,
      100, // < 10%
      Date.now() + 60_000
    );

    expect(refreshPolicy.isRefreshAllowed('kanishka')).toBe(false);
  });
});
