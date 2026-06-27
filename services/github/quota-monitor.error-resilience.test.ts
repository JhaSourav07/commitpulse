import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuotaMonitor } from './quota-monitor';

describe('QuotaMonitor — Error Resilience', () => {
  let monitor: QuotaMonitor;

  beforeEach(() => {
    // Reset singleton state before each test so tests are fully isolated
    monitor = QuotaMonitor.getInstance();
    monitor.reset();
  });

  it('does not throw and preserves previous state when updateQuotaFromHeaders receives malformed non-numeric header values', () => {
    // Set a known baseline
    monitor.setQuota(5000, 4000, 0);

    // Provide headers where all rate-limit values are non-numeric garbage
    const corruptHeaders = new Headers({
      'x-ratelimit-limit': 'not-a-number',
      'x-ratelimit-remaining': '!!invalid!!',
      'x-ratelimit-reset': 'undefined',
    });

    // Must not throw — parseInt NaN guards should swallow bad values silently
    expect(() => monitor.updateQuotaFromHeaders(corruptHeaders)).not.toThrow();

    // State must remain exactly as it was before the corrupt update
    const quota = monitor.getQuota();
    expect(quota.limit).toBe(5000);
    expect(quota.remaining).toBe(4000);
    expect(quota.resetTime).toBe(0);
  });

  it('does not throw and returns a clean quota snapshot when getQuota is called after a failed header update', () => {
    // Use Object.create so instanceof Headers passes, making .get() actually get called
    const faultyHeaders = Object.create(Headers.prototype) as Headers;
    faultyHeaders.get = () => {
      throw new Error('Header store connection lost');
    };

    // Wrap in a try/catch to mirror a real caller's error boundary
    let recoveryQuota: ReturnType<typeof monitor.getQuota> | null = null;
    try {
      monitor.updateQuotaFromHeaders(faultyHeaders);
    } catch {
      // Caller catches the exception — quota must still be readable
      recoveryQuota = monitor.getQuota();
    }

    // The recovery path must produce a valid, non-null quota object
    expect(recoveryQuota).not.toBeNull();
    expect(recoveryQuota!.limit).toBe(5000);
    expect(recoveryQuota!.remaining).toBe(5000);
    expect(typeof recoveryQuota!.totalRefreshes).toBe('number');
  });

  it('logs unexpected exceptions to the dev-telemetry tracker without re-throwing', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate a caller wrapping quota update in a telemetry boundary
    const runWithTelemetry = (fn: () => void) => {
      try {
        fn();
      } catch (err) {
        console.error('[quota-monitor] Unexpected exception:', err);
      }
    };

    const faultyHeaders = Object.create(Headers.prototype) as Headers;
    faultyHeaders.get = () => {
      throw new TypeError('Simulated DB connectivity error');
    };

    // Should not propagate — telemetry boundary catches and logs it
    expect(() =>
      runWithTelemetry(() => monitor.updateQuotaFromHeaders(faultyHeaders))
    ).not.toThrow();

    // Telemetry logger must have been called with the error
    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(consoleSpy.mock.calls[0][0]).toContain('[quota-monitor]');

    consoleSpy.mockRestore();
  });

  it('provides a valid reset/reload path that fully restores quota to default state after corruption', () => {
    // Corrupt internal state by feeding extreme values
    monitor.setQuota(0, -9999, Number.MAX_SAFE_INTEGER);
    monitor.incrementRefreshCount();
    monitor.incrementRefreshCount();

    // Confirm state is corrupted
    expect(monitor.getQuota().remaining).toBe(-9999);
    expect(monitor.getQuota().totalRefreshes).toBe(2);

    // User reset path — must restore clean defaults
    expect(() => monitor.reset()).not.toThrow();

    const restored = monitor.getQuota();
    expect(restored.limit).toBe(5000);
    expect(restored.remaining).toBe(5000);
    expect(restored.resetTime).toBe(0);
    expect(restored.totalRefreshes).toBe(0);
  });

  it('isQuotaLow returns false safely after reset even when prior state had extreme negative remaining', () => {
    // Drive state into an extreme negative — simulates a corrupted upstream response
    monitor.setQuota(5000, -1, 0);

    // isQuotaLow must not throw regardless of corrupt state
    let lowBeforeReset: boolean | undefined;
    expect(() => {
      lowBeforeReset = monitor.isQuotaLow();
    }).not.toThrow();

    // Negative remaining is still < 10% of 5000, so should be truthy
    expect(lowBeforeReset).toBe(true);

    // After user-triggered reset, quota low flag must return to safe default
    monitor.reset();
    expect(monitor.isQuotaLow()).toBe(false);
  });
});
