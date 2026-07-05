import { describe, it, expect, expectTypeOf } from 'vitest';
import { useShareActions } from './useShareActions';
import type { DashboardExportData, ActivityData, LanguageData, UserStats } from '@/types/dashboard';

// Infer the hook's public API directly from its implementation so the tests
// automatically fail if the return contract or parameter schema changes.
type UseShareActionsReturn = ReturnType<typeof useShareActions>;
type UseShareActionsArgs = Parameters<typeof useShareActions>;

describe('useShareActions — TypeScript compiler validation & schema constraints', () => {
  it('1. accepts exactly (username: string, exportData: DashboardExportData, onClose: () => void)', () => {
    expectTypeOf(useShareActions).parameters.toEqualTypeOf<
      [string, DashboardExportData, () => void]
    >();

    expect(useShareActions.length).toBe(3);
  });

  it('2. DashboardExportData accepts its optional activity field being omitted', () => {
    const minimal: DashboardExportData = {
      stats: {
        currentStreak: 0,
        peakStreak: 0,
        totalContributions: 0,
      },
      languages: [],
    };

    expect(minimal.activity).toBeUndefined();

    expectTypeOf<DashboardExportData['activity']>().toEqualTypeOf<ActivityData[] | undefined>();

    expectTypeOf<DashboardExportData['stats']>().toEqualTypeOf<UserStats>();

    expectTypeOf<DashboardExportData['languages']>().toEqualTypeOf<LanguageData[]>();
  });

  it('3. returns the expected public API shape and state schema', () => {
    expectTypeOf<UseShareActionsReturn>().toHaveProperty('states');
    expectTypeOf<UseShareActionsReturn>().toHaveProperty('handleCopyLink');
    expectTypeOf<UseShareActionsReturn>().toHaveProperty('handleTwitter');
    expectTypeOf<UseShareActionsReturn>().toHaveProperty('handleLinkedIn');
    expectTypeOf<UseShareActionsReturn>().toHaveProperty('handleReddit');
    expectTypeOf<UseShareActionsReturn>().toHaveProperty('handleDownloadPNG');
    expectTypeOf<UseShareActionsReturn>().toHaveProperty('handleDownloadWEBP');
    expectTypeOf<UseShareActionsReturn>().toHaveProperty('handleCopyImage');
    expectTypeOf<UseShareActionsReturn>().toHaveProperty('handleDownloadSVG');
    expectTypeOf<UseShareActionsReturn>().toHaveProperty('handleCopyMarkdown');
    expectTypeOf<UseShareActionsReturn>().toHaveProperty('handleDownloadCSV');
    expectTypeOf<UseShareActionsReturn>().toHaveProperty('handleDownloadJSON');
    expectTypeOf<UseShareActionsReturn>().toHaveProperty('handleDownloadSTL');
    expectTypeOf<UseShareActionsReturn>().toHaveProperty('handleNativeShare');

    expectTypeOf<UseShareActionsReturn['states']>().toEqualTypeOf<
      Record<string, 'idle' | 'loading' | 'success' | 'error'>
    >();
  });

  it('4. handlers expose the expected async/sync signatures', () => {
    // Async handlers
    expectTypeOf<UseShareActionsReturn['handleCopyLink']>().returns.toEqualTypeOf<
      Promise<boolean>
    >();

    expectTypeOf<UseShareActionsReturn['handleDownloadPNG']>().returns.toEqualTypeOf<
      Promise<void>
    >();

    expectTypeOf<UseShareActionsReturn['handleDownloadWEBP']>().returns.toEqualTypeOf<
      Promise<void>
    >();

    expectTypeOf<UseShareActionsReturn['handleCopyImage']>().returns.toEqualTypeOf<Promise<void>>();

    expectTypeOf<UseShareActionsReturn['handleDownloadSVG']>().returns.toEqualTypeOf<
      Promise<void>
    >();

    expectTypeOf<UseShareActionsReturn['handleCopyMarkdown']>().returns.toEqualTypeOf<
      Promise<void>
    >();

    expectTypeOf<UseShareActionsReturn['handleNativeShare']>().returns.toEqualTypeOf<
      Promise<void>
    >();

    // Sync handlers
    expectTypeOf<UseShareActionsReturn['handleTwitter']>().returns.toBeVoid();

    expectTypeOf<UseShareActionsReturn['handleLinkedIn']>().returns.toBeVoid();

    expectTypeOf<UseShareActionsReturn['handleReddit']>().returns.toBeVoid();

    expectTypeOf<UseShareActionsReturn['handleDownloadCSV']>().returns.toBeVoid();

    expectTypeOf<UseShareActionsReturn['handleDownloadJSON']>().returns.toBeVoid();

    expectTypeOf<UseShareActionsReturn['handleDownloadSTL']>().returns.toBeVoid();

    // No handler should accept parameters.
    expectTypeOf<UseShareActionsReturn['handleCopyLink']>().parameters.toEqualTypeOf<[]>();

    expectTypeOf<UseShareActionsReturn['handleDownloadCSV']>().parameters.toEqualTypeOf<[]>();
  });

  it('5. rejects invalid hook arguments during static type checking', () => {
    const validExportData: DashboardExportData = {
      stats: {
        currentStreak: 0,
        peakStreak: 0,
        totalContributions: 0,
      },
      languages: [],
    };

    // @ts-expect-error username must be a string
    const invalidUsername: UseShareActionsArgs = [123, validExportData, () => {}];

    // @ts-expect-error exportData must satisfy DashboardExportData
    const invalidExportData: UseShareActionsArgs = ['pari', { activity: [] }, () => {}];

    // @ts-expect-error onClose must be a callback
    const invalidOnClose: UseShareActionsArgs = ['pari', validExportData, 'not-a-function'];

    // @ts-expect-error missing required arguments
    const missingArgs: UseShareActionsArgs = ['pari'];

    void invalidUsername;
    void invalidExportData;
    void invalidOnClose;
    void missingArgs;
  });
});
