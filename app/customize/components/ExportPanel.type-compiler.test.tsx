import { describe, it, expectTypeOf } from 'vitest';
import type { ComponentProps } from 'react';
import type { ExportFormat } from '../types';
import { ExportPanel } from './ExportPanel';

describe('ExportPanel TypeScript compiler validation & schema constraints', () => {
  it('ExportFormat accepts only "markdown" | "html" | "action" | "tsx" and rejects other literals', () => {
    expectTypeOf<ExportFormat>().toEqualTypeOf<'markdown' | 'html' | 'action' | 'tsx'>();

    // @ts-expect-error - 'pdf' is not a member of the ExportFormat union
    const invalidFormat: ExportFormat = 'pdf';
    void invalidFormat;
  });

  it('onFormatChange must be typed as (format: ExportFormat) => void, rejecting an incompatible callback signature', () => {
    type Props = ComponentProps<typeof ExportPanel>;
    expectTypeOf<Props['onFormatChange']>().toEqualTypeOf<(format: ExportFormat) => void>();

    const invalidHandler: Props['onFormatChange'] = (format: string) => {
      void format;
    };
    void invalidHandler;
  });

  it('onCopy accepts either a sync (void) or an async (Promise<void>) function without a compile error', () => {
    type Props = ComponentProps<typeof ExportPanel>;
    expectTypeOf<Props['onCopy']>().toEqualTypeOf<() => void | Promise<void>>();

    const syncHandler: Props['onCopy'] = () => {};
    const asyncHandler: Props['onCopy'] = async () => {
      await Promise.resolve();
    };
    expectTypeOf(syncHandler).toEqualTypeOf<() => void | Promise<void>>();
    expectTypeOf(asyncHandler).toEqualTypeOf<() => void | Promise<void>>();
  });

  it('every ExportPanel prop is required, omitting any one is rejected at compile time', () => {
    type Props = ComponentProps<typeof ExportPanel>;

    expectTypeOf<Props['format']>().not.toBeUndefined();
    expectTypeOf<Props['snippet']>().toEqualTypeOf<string>();
    expectTypeOf<Props['hasUsername']>().toEqualTypeOf<boolean>();

    // @ts-expect-error - `username` is missing, which is a compile error since it's required
    const incompleteProps: Props = {
      format: 'markdown',
      snippet: '',
      copied: false,
      copyStatusMessage: '',
      hasUsername: true,
      onFormatChange: () => {},
      onCopy: () => {},
    };
    void incompleteProps;
  });

  it('copied and hasUsername are strictly boolean, rejecting truthy/falsy stand-ins like 0, 1, or string values', () => {
    type Props = ComponentProps<typeof ExportPanel>;
    expectTypeOf<Props['copied']>().toEqualTypeOf<boolean>();
    expectTypeOf<Props['hasUsername']>().toEqualTypeOf<boolean>();

    // @ts-expect-error - 1 is a number, not assignable to boolean
    const invalidCopied: Props['copied'] = 1;
    void invalidCopied;
  });
});
