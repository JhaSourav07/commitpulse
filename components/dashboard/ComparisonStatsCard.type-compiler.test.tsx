import { describe, it, expectTypeOf } from 'vitest';
import type { ComparisonStatsCardProps } from './ComparisonStatsCard';

describe('ComparisonStatsCard TypeScript compiler validation', () => {
  it('accepts valid props shape', () => {
    expectTypeOf<ComparisonStatsCardProps>().toMatchTypeOf({
      title: '',
      valueA: 0,
      valueB: 0,
      labelA: '',
      labelB: '',
      icon: '',
    });
  });

  it('enforces string fields', () => {
    expectTypeOf<ComparisonStatsCardProps['title']>().toEqualTypeOf<string>();
    expectTypeOf<ComparisonStatsCardProps['labelA']>().toEqualTypeOf<string>();
    expectTypeOf<ComparisonStatsCardProps['labelB']>().toEqualTypeOf<string>();
    expectTypeOf<ComparisonStatsCardProps['icon']>().toEqualTypeOf<string>();
  });

  it('enforces numeric value fields', () => {
    expectTypeOf<ComparisonStatsCardProps['valueA']>().toEqualTypeOf<number>();
    expectTypeOf<ComparisonStatsCardProps['valueB']>().toEqualTypeOf<number>();
  });

  it('requires all props', () => {
    type RequiredKeys = keyof ComparisonStatsCardProps;

    expectTypeOf<RequiredKeys>().toEqualTypeOf<
      'title' | 'valueA' | 'valueB' | 'labelA' | 'labelB' | 'icon'
    >();
  });

  it('supports valid component prop object assignment', () => {
    const props: ComparisonStatsCardProps = {
      title: 'Commits',
      valueA: 10,
      valueB: 15,
      labelA: 'Alice',
      labelB: 'Bob',
      icon: 'GitCommit',
    };

    expectTypeOf(props).toMatchTypeOf<ComparisonStatsCardProps>();
  });
});
