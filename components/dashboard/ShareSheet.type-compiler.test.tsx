import { describe, it, expectTypeOf } from 'vitest';
import type { DashboardExportData } from '@/types/dashboard';
import type { ShareSheetProps } from './ShareSheet';

describe('ShareSheet Type Compiler Validation', () => {
  it('username should be string', () => {
    expectTypeOf<ShareSheetProps['username']>().toEqualTypeOf<string>();
  });

  it('isOpen should be boolean', () => {
    expectTypeOf<ShareSheetProps['isOpen']>().toEqualTypeOf<boolean>();
  });

  it('onClose should be callback function', () => {
    expectTypeOf<ShareSheetProps['onClose']>().toEqualTypeOf<() => void>();
  });

  it('exportData should match DashboardExportData', () => {
    expectTypeOf<ShareSheetProps['exportData']>().toEqualTypeOf<DashboardExportData>();
  });

  it('valid props object should satisfy ShareSheetProps', () => {
    const props: ShareSheetProps = {
      username: 'octocat',
      isOpen: true,
      onClose: () => {},
      exportData: {} as DashboardExportData,
    };

    expectTypeOf(props).toMatchTypeOf<ShareSheetProps>();
  });
});

// Compile-time validation checks

const invalidUsername: ShareSheetProps = {
  // @ts-expect-error username must be string
  username: 123,
  isOpen: true,
  onClose: () => {},
  exportData: {} as DashboardExportData,
};

const invalidIsOpen: ShareSheetProps = {
  username: 'octocat',
  // @ts-expect-error isOpen must be boolean
  isOpen: 'true',
  onClose: () => {},
  exportData: {} as DashboardExportData,
};

const invalidOnClose: ShareSheetProps = {
  username: 'octocat',
  isOpen: true,
  // @ts-expect-error onClose must be function
  onClose: 'close',
  exportData: {} as DashboardExportData,
};
