import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';
import GrowthTrendChart from './GrowthTrendChart';

type GrowthTrendChartProps = React.ComponentProps<typeof GrowthTrendChart>;

type ActivityItem = GrowthTrendChartProps['activityA'][number];

describe('GrowthTrendChart type & schema compiler checks (Variation 10)', () => {
  it('Case 1: Validate baseline property types for all props', () => {
    expectTypeOf<GrowthTrendChartProps['labelA']>().toEqualTypeOf<string>();
    expectTypeOf<GrowthTrendChartProps['labelB']>().toEqualTypeOf<string>();
    expectTypeOf<GrowthTrendChartProps['activityA']>().toEqualTypeOf<ActivityItem[]>();
    expectTypeOf<GrowthTrendChartProps['activityB']>().toEqualTypeOf<ActivityItem[]>();
    expectTypeOf<ActivityItem['date']>().toEqualTypeOf<string>();
    expectTypeOf<ActivityItem['count']>().toEqualTypeOf<number>();
  });

  it('Case 2: Ensure invalid activity item shapes are blocked during static type checks', () => {
    type InvalidDateType = { date: number; count: string };
    expectTypeOf<InvalidDateType>().not.toMatchTypeOf<ActivityItem>();

    type ExtraRequiredField = { date: string; count: number; extra: boolean };
    expectTypeOf<ExtraRequiredField>().toMatchTypeOf<ActivityItem>();
  });

  it('Case 3: Verify minimal and complete props shapes are structurally compatible', () => {
    type MinimalProps = {
      activityA: Array<{ date: string; count: number }>;
      activityB: Array<{ date: string; count: number }>;
      labelA: string;
      labelB: string;
    };
    expectTypeOf<MinimalProps>().toMatchTypeOf<GrowthTrendChartProps>();

    type ExtraProps = MinimalProps & { extraField?: string };
    expectTypeOf<ExtraProps>().toMatchTypeOf<GrowthTrendChartProps>();
  });

  it('Case 4: Assert schema validation rejects out-of-bounds activity data with flat error reports', () => {
    const activitySchema = z
      .object({
        date: z.string().min(1),
        count: z.number().int().nonnegative(),
      })
      .strict();

    const outOfBoundsRecord = {
      date: '',
      count: -5,
      extraField: 'unexpected',
    };

    const result = activitySchema.safeParse(outOfBoundsRecord);
    expect(result.success).toBe(false);

    if (!result.success) {
      const flatErrors = result.error.flatten();
      expect(flatErrors.fieldErrors).toHaveProperty('date');
      expect(flatErrors.fieldErrors).toHaveProperty('count');

      const hasUnrecognizedExtra = result.error.issues.some(
        (issue) => issue.code === 'unrecognized_keys' && issue.keys.includes('extraField')
      );
      expect(hasUnrecognizedExtra).toBe(true);
    }
  });

  it('Case 5: Prove compliant activity data clears validation and preserves type integrity', () => {
    const activitySchema = z
      .object({
        date: z.string().min(1),
        count: z.number().int().nonnegative(),
      })
      .strict();

    const validRecord = { date: '2026-06-03', count: 12 };
    const parsed = activitySchema.parse(validRecord);
    expect(parsed).toEqual(validRecord);

    type ParsedType = z.infer<typeof activitySchema>;
    expectTypeOf<ParsedType>().toMatchTypeOf<ActivityItem>();
  });
});
