import { describe, it, expectTypeOf } from 'vitest';
import type { StatsCardProps } from './StatsCard';

describe('StatsCard Type Compiler Validation', () => {
  it('accepts valid props shape', () => {
    expectTypeOf<StatsCardProps>().toMatchTypeOf<{
      title: string;
      value: string;
      description: string;
      icon: string;
      showUTCDisclaimer?: boolean;
      utcDate?: string;
    }>();
  });

  it('requires title as string', () => {
    expectTypeOf<StatsCardProps['title']>().toEqualTypeOf<string>();
  });

  it('requires value as string', () => {
    expectTypeOf<StatsCardProps['value']>().toEqualTypeOf<string>();
  });

  it('requires description as string', () => {
    expectTypeOf<StatsCardProps['description']>().toEqualTypeOf<string>();
  });

  it('allows optional UTC fields', () => {
    expectTypeOf<StatsCardProps['showUTCDisclaimer']>().toEqualTypeOf<boolean | undefined>();

    expectTypeOf<StatsCardProps['utcDate']>().toEqualTypeOf<string | undefined>();
  });
});
