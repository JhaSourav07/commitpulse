import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RefreshPolicy } from './refresh-policy';

// Mock the quota monitor to avoid interference
vi.mock('./quota-monitor', () => ({
  quotaMonitor: {
    isQuotaLow: vi.fn(() => false),
    incrementRefreshCount: vi.fn(),
  },
}));

describe('RefreshPolicy - Massive Scaling & Bounds (Variation 2)', () => {
  let policy: RefreshPolicy;

  beforeEach(() => {
    policy = RefreshPolicy.getInstance();
    policy.reset();
    vi.clearAllMocks();
  });

  it('High-Volume Data Injection: rapidly inserts 10,000 distinct usernames without memory overflow', () => {
    const VOLUME = 10000;

    // Inject 10,000 users
    for (let i = 0; i < VOLUME; i++) {
      policy.recordRefresh(`user_${i}`);
    }

    // Verify a random subset to ensure map holds state correctly
    expect(policy.isRefreshAllowed(`user_0`)).toBe(false);
    expect(policy.isRefreshAllowed(`user_5000`)).toBe(false);
    expect(policy.isRefreshAllowed(`user_9999`)).toBe(false);
    expect(policy.isRefreshAllowed(`unrecorded_user`)).toBe(true);
  });

  it('Extreme Cooldown Limits: processes Number.MAX_SAFE_INTEGER seamlessly without JS overflow', () => {
    policy.setCooldown(Number.MAX_SAFE_INTEGER);
    policy.recordRefresh('timetraveler');

    // With MAX_SAFE_INTEGER, remaining cooldown should be massive but valid
    const remaining = policy.getRemainingCooldown('timetraveler');

    // We allow a small 10000ms delta for the execution time gap between Date.now()
    expect(remaining).toBeGreaterThan(Number.MAX_SAFE_INTEGER - 10000);
    expect(policy.isRefreshAllowed('timetraveler')).toBe(false);
  });

  it('High-Speed Query Stress Test: executes 10,000 rapid calls under 50ms total execution time', () => {
    const VOLUME = 10000;
    // Pre-populate
    for (let i = 0; i < VOLUME; i++) {
      policy.recordRefresh(`user_${i}`);
    }

    // Measure query time
    const start = performance.now();
    for (let i = 0; i < VOLUME; i++) {
      policy.isRefreshAllowed(`user_${i}`);
    }
    const end = performance.now();

    const executionTimeMs = end - start;
    // Execution time should be exceptionally fast (under 50ms for 10k Map lookups)
    expect(executionTimeMs).toBeLessThan(50);
  });

  it('Massive String Input Bound: safely trims and processes a 100,000+ character string without loop crashing', () => {
    const massiveString = 'a'.repeat(100000);
    const untrimmedMassive = `   ${massiveString}   `;

    // Should process without throwing memory or stack errors
    policy.recordRefresh(untrimmedMassive);

    // The exact trimmed string should correctly map
    expect(policy.isRefreshAllowed(massiveString)).toBe(false);
    expect(policy.getRemainingCooldown(massiveString)).toBeGreaterThan(0);
  });

  it('Bulk Cooldown Retrieval: rapidly calculates cache-misses for 10,000+ unrecorded users without degrading', () => {
    const start = performance.now();
    const VOLUME = 10000;

    let cacheMisses = 0;
    for (let i = 0; i < VOLUME; i++) {
      if (policy.getRemainingCooldown(`phantom_${i}`) === 0) {
        cacheMisses++;
      }
    }
    const end = performance.now();

    expect(cacheMisses).toBe(VOLUME);
    // Retrieval misses should also be extremely fast (under 50ms)
    expect(end - start).toBeLessThan(50);
  });
});
