// services/github/quota-monitor.type-compiler.test.ts

import { describe, expectTypeOf, it } from 'vitest';
import { quotaMonitor, QuotaMonitor } from './quota-monitor';

describe('QuotaMonitor Type Compiler Validation', () => {
  it('exposes the expected quota object shape', () => {
    expectTypeOf(quotaMonitor.getQuota()).toMatchTypeOf<{
      limit: number;
      remaining: number;
      resetTime: number;
      totalRefreshes: number;
    }>();
  });

  it('returns numeric quota fields', () => {
    const quota = quotaMonitor.getQuota();

    expectTypeOf(quota.limit).toEqualTypeOf<number>();
    expectTypeOf(quota.remaining).toEqualTypeOf<number>();
    expectTypeOf(quota.resetTime).toEqualTypeOf<number>();
    expectTypeOf(quota.totalRefreshes).toEqualTypeOf<number>();
  });

  it('accepts valid updateQuotaFromHeaders parameter types', () => {
    expectTypeOf(quotaMonitor.updateQuotaFromHeaders).parameters.toMatchTypeOf<
      [Headers | Record<string, string>, string?]
    >();
  });

  it('accepts numeric parameters for setQuota', () => {
    expectTypeOf(quotaMonitor.setQuota).parameters.toEqualTypeOf<
      [number, number, number, string?]
    >();
  });

  it('maintains singleton instance typing', () => {
    expectTypeOf(QuotaMonitor.getInstance()).toEqualTypeOf<QuotaMonitor>();
    expectTypeOf(quotaMonitor).toEqualTypeOf<QuotaMonitor>();
  });
});
