import { describe, expectTypeOf, it } from 'vitest';
import PRTrendChart from './PRTrendChart';
import type { PRInsightData } from '@/services/github/pr-insights';

type PRTrendChartProps = React.ComponentProps<typeof PRTrendChart>;

describe('PRTrendChart Type Compiler Validation', () => {
  it('accepts valid data prop type', () => {
    expectTypeOf<PRTrendChartProps['data']>().toEqualTypeOf<PRInsightData>();
  });

  it('exports PRTrendChart as a callable React component', () => {
    expectTypeOf(PRTrendChart).toBeFunction();
  });

  it('accepts valid component props', () => {
    const props: PRTrendChartProps = {
      data: {} as PRInsightData,
    };

    expectTypeOf(props).toMatchTypeOf<PRTrendChartProps>();
  });

  it('preserves schema type for PR insight data', () => {
    expectTypeOf<PRInsightData>().toMatchTypeOf<PRTrendChartProps['data']>();
  });

  it('supports compile-time validation for component props', () => {
    expectTypeOf<PRTrendChartProps>().toHaveProperty('data');
  });
});

// Compile-time validation

void ({
  // @ts-expect-error data must follow PRInsightData
  data: 'invalid',
} satisfies PRTrendChartProps);

void ({
  // @ts-expect-error data cannot be a number
  data: 123,
} satisfies PRTrendChartProps);
