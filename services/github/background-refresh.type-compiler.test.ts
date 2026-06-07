import { describe, expect, expectTypeOf, it } from 'vitest';
import backgroundRefresh, { BackgroundRefresh } from './background-refresh';

describe('BackgroundRefresh type compiler validation', () => {
  it('exposes singleton instance with correct type', () => {
    expectTypeOf(BackgroundRefresh.getInstance()).toEqualTypeOf<BackgroundRefresh>();
    expectTypeOf(backgroundRefresh).toEqualTypeOf<BackgroundRefresh>();
  });

  it('enforces public method input and return types', () => {
    expectTypeOf(backgroundRefresh.isStale).parameters.toEqualTypeOf<
      [lastSyncedAt: string | undefined]
    >();
    expectTypeOf(backgroundRefresh.isStale).returns.toEqualTypeOf<boolean>();

    expectTypeOf(backgroundRefresh.triggerRefresh).parameters.toEqualTypeOf<[username: string]>();
    expectTypeOf(backgroundRefresh.triggerRefresh).returns.toEqualTypeOf<Promise<void>>();

    expectTypeOf(backgroundRefresh.isJobActive).parameters.toEqualTypeOf<[username: string]>();
    expectTypeOf(backgroundRefresh.isJobActive).returns.toEqualTypeOf<boolean>();
  });

  it('blocks invalid parameters during static type checking', () => {
    type IsStaleParams = Parameters<typeof backgroundRefresh.isStale>;
    type TriggerRefreshParams = Parameters<typeof backgroundRefresh.triggerRefresh>;
    type IsJobActiveParams = Parameters<typeof backgroundRefresh.isJobActive>;

    expectTypeOf<[number]>().not.toMatchTypeOf<IsStaleParams>();
    expectTypeOf<[]>().not.toMatchTypeOf<TriggerRefreshParams>();
    expectTypeOf<[null]>().not.toMatchTypeOf<IsJobActiveParams>();
  });

  it('accepts optional timestamp values without compile errors', () => {
    expect(backgroundRefresh.isStale(undefined)).toBe(true);
    expect(backgroundRefresh.isStale(new Date().toISOString())).toBe(false);
  });

  it('validates stale date constraints strictly', () => {
    const staleDate = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    const freshDate = new Date().toISOString();

    expect(backgroundRefresh.isStale(staleDate)).toBe(true);
    expect(backgroundRefresh.isStale(freshDate)).toBe(false);
    expect(backgroundRefresh.isStale('invalid-date')).toBe(true);
  });
});
