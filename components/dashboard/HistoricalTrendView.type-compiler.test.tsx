import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';
import type { ActivityData } from '@/types/dashboard';
import type { DashboardPeriod } from '@/utils/dashboardPeriod';

export interface HistoricalTrendViewProps {
  username: string;
  activity: ActivityData[];
  period: DashboardPeriod;
}

describe('HistoricalTrendView type & schema compiler checks (Variation 10)', () => {
  // Case 1: Verifies baseline types for primitive and union properties match accurately
  it('Case 1: Validate baseline property fields (date, count, intensity) to verify type matching parameters align perfectly', () => {
    expectTypeOf<ActivityData['date']>().toEqualTypeOf<string>();
    expectTypeOf<ActivityData['count']>().toEqualTypeOf<number>();
    expectTypeOf<ActivityData['intensity']>().toEqualTypeOf<0 | 1 | 2 | 3 | 4>();
  });

  // Case 2: Asserts static type checking blocks misaligned interface layouts from compiling
  it('Case 2: Ensure invalid structural definitions are caught and blocked during static assignment checks', () => {
    type InvalidActivity = {
      date: number;
      count: string;
      intensity: 5;
    };

    type InvalidPeriod = {
      kind: 'unknown';
      label: number;
    };

    expectTypeOf<InvalidActivity>().not.toMatchTypeOf<ActivityData>();
    expectTypeOf<InvalidPeriod>().not.toMatchTypeOf<DashboardPeriod>();
  });

  // Case 3: Confirms the component wrapper handles minimal and complete optional envelopes cleanly
  it('Case 3: Verify the complex trend props envelope seamlessly tolerates optional parameters without dropping compilation support', () => {
    type MinimalActivity = {
      date: string;
      count: number;
      intensity: 0 | 1 | 2 | 3 | 4;
    };

    type MinimalPeriod = {
      kind: 'rolling';
      label: string;
      from: string;
      to: string;
    };

    type MinimalProps = {
      username: string;
      activity: MinimalActivity[];
      period: MinimalPeriod;
    };

    expectTypeOf<MinimalProps>().toMatchTypeOf<HistoricalTrendViewProps>();

    type FullActivity = {
      date: string;
      count: number;
      intensity: 0 | 1 | 2 | 3 | 4;
      locAdditions: number;
      locDeletions: number;
    };

    type FullPeriod = {
      kind: 'month';
      label: string;
      from: string;
      to: string;
      month: string;
      year: string;
    };

    type FullProps = {
      username: string;
      activity: FullActivity[];
      period: FullPeriod;
    };

    expectTypeOf<FullProps>().toMatchTypeOf<HistoricalTrendViewProps>();
  });

  // Case 4: Checks that out-of-bounds parameters generate flat field errors and catch unexpected fields
  it('Case 4: Assert that an associated strict validation schema rejects out-of-bounds metrics fields with explicit flat error reports', () => {
    const activityDataSchema = z
      .object({
        date: z.string().min(1),
        count: z.number().int().nonnegative(),
        intensity: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
        locAdditions: z.number().int().nonnegative().optional(),
        locDeletions: z.number().int().nonnegative().optional(),
      })
      .strict();

    const outOfBoundsRecord = {
      date: '',
      count: -15,
      intensity: 10,
      locAdditions: -5,
      extraField: 'unexpected',
    };

    const result = activityDataSchema.safeParse(outOfBoundsRecord);
    expect(result.success).toBe(false);

    if (!result.success) {
      const flatErrors = result.error.flatten();

      expect(flatErrors.fieldErrors).toHaveProperty('date');
      expect(flatErrors.fieldErrors).toHaveProperty('count');
      expect(flatErrors.fieldErrors).toHaveProperty('intensity');
      expect(flatErrors.fieldErrors).toHaveProperty('locAdditions');

      const hasUnrecognizedExtra = result.error.issues.some(
        (issue) => issue.code === 'unrecognized_keys' && issue.keys.includes('extraField')
      );
      expect(hasUnrecognizedExtra).toBe(true);
    }
  });

  // Case 5: Validates clean payloads clear parsing pipelines and maintain type assignability properties
  it('Case 5: Prove that standard compliant data records cleanly clear validation gates and preserve underlying type integrity definitions', () => {
    const activityDataSchema = z
      .object({
        date: z.string().min(1),
        count: z.number().int().nonnegative(),
        intensity: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
        locAdditions: z.number().int().nonnegative().optional(),
        locDeletions: z.number().int().nonnegative().optional(),
      })
      .strict();

    const validRecord = {
      date: '2026-06-03',
      count: 12,
      intensity: 3 as const,
      locAdditions: 150,
      locDeletions: 20,
    };

    const parsed = activityDataSchema.parse(validRecord);
    expect(parsed).toEqual(validRecord);

    type ParsedType = z.infer<typeof activityDataSchema>;
    expectTypeOf<ParsedType>().toMatchTypeOf<ActivityData>();
  });
});
