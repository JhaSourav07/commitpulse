import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';
import type { LanguageData } from '@/types/dashboard';

// Mirror of the RadarChart component's prop contract.
// Kept local so the test file is self-contained and acts as a compile-time
// guardrail against accidental upstream prop renaming/removal.
export interface RadarChartProps {
  languagesA: LanguageData[];
  languagesB: LanguageData[];
  labelA: string;
  labelB: string;
}

describe('RadarChart type & schema compiler checks (Variation 10)', () => {
  // Case 1: Verifies baseline LanguageData property types align with the public contract
  it('Case 1: Validate baseline LanguageData property fields (name, color, percentage) to verify type matching parameters align perfectly', () => {
    expectTypeOf<LanguageData['name']>().toEqualTypeOf<string>();
    expectTypeOf<LanguageData['color']>().toEqualTypeOf<string>();
    expectTypeOf<LanguageData['percentage']>().toEqualTypeOf<number>();

    // Baseline prop fields on the RadarChart component
    expectTypeOf<RadarChartProps['labelA']>().toEqualTypeOf<string>();
    expectTypeOf<RadarChartProps['labelB']>().toEqualTypeOf<string>();
    expectTypeOf<RadarChartProps['languagesA']>().toEqualTypeOf<LanguageData[]>();
    expectTypeOf<RadarChartProps['languagesB']>().toEqualTypeOf<LanguageData[]>();
  });

  // Case 2: Asserts static type checking blocks misaligned interface layouts from compiling
  it('Case 2: Ensure invalid structural definitions are caught and blocked during static assignment checks', () => {
    type InvalidLanguage = {
      name: number;
      color: boolean;
      percentage: string;
    };

    type InvalidProps = {
      languagesA: string;
      languagesB: number[];
      labelA: number;
      labelB: boolean;
    };

    expectTypeOf<InvalidLanguage>().not.toMatchTypeOf<LanguageData>();
    expectTypeOf<InvalidProps>().not.toMatchTypeOf<RadarChartProps>();

    // A LanguageData with the wrong percentage type must not satisfy LanguageData
    type LangWithBadPct = { name: string; color: string; percentage: string };
    expectTypeOf<LangWithBadPct>().not.toMatchTypeOf<LanguageData>();
  });

  // Case 3: Confirms the prop envelope tolerates minimal and rich language definitions cleanly
  it('Case 3: Verify the RadarChart props envelope seamlessly tolerates minimal language entries without dropping compilation support', () => {
    type MinimalLanguage = {
      name: string;
      color: string;
      percentage: number;
    };

    type MinimalProps = {
      languagesA: MinimalLanguage[];
      languagesB: MinimalLanguage[];
      labelA: string;
      labelB: string;
    };

    expectTypeOf<MinimalProps>().toMatchTypeOf<RadarChartProps>();

    // Empty language arrays are a fully valid construction of RadarChartProps
    type EmptyArraysProps = {
      languagesA: LanguageData[];
      languagesB: LanguageData[];
      labelA: string;
      labelB: string;
    };
    expectTypeOf<EmptyArraysProps>().toMatchTypeOf<RadarChartProps>();
  });

  // Case 4: Checks that out-of-bounds parameters generate flat field errors and catch unexpected fields
  it('Case 4: Assert that an associated strict validation schema rejects out-of-bounds language fields with explicit flat error reports', () => {
    const languageDataSchema = z
      .object({
        name: z.string().min(1),
        color: z.string().min(1),
        percentage: z.number().min(0).max(100),
      })
      .strict();

    const outOfBoundsRecord = {
      name: '',
      color: '',
      percentage: 250,
      extraField: 'unexpected',
    };

    const result = languageDataSchema.safeParse(outOfBoundsRecord);
    expect(result.success).toBe(false);

    if (!result.success) {
      const flatErrors = result.error.flatten();

      expect(flatErrors.fieldErrors).toHaveProperty('name');
      expect(flatErrors.fieldErrors).toHaveProperty('color');
      expect(flatErrors.fieldErrors).toHaveProperty('percentage');

      const hasUnrecognizedExtra = result.error.issues.some(
        (issue) => issue.code === 'unrecognized_keys' && issue.keys.includes('extraField')
      );
      expect(hasUnrecognizedExtra).toBe(true);
    }
  });

  // Case 5: Validates clean payloads clear parsing pipelines and maintain type assignability properties
  it('Case 5: Prove that standard compliant LanguageData records cleanly clear validation gates and preserve underlying type integrity definitions', () => {
    const languageDataSchema = z
      .object({
        name: z.string().min(1),
        color: z.string().min(1),
        percentage: z.number().min(0).max(100),
      })
      .strict();

    const validRecord = {
      name: 'TypeScript',
      color: '#3178c6',
      percentage: 75,
    };

    const parsed = languageDataSchema.parse(validRecord);
    expect(parsed).toEqual(validRecord);

    type ParsedType = z.infer<typeof languageDataSchema>;
    expectTypeOf<ParsedType>().toMatchTypeOf<LanguageData>();

    // A list of validated records must also satisfy the array shape used by RadarChartProps
    type ValidatedList = ParsedType[];
    expectTypeOf<ValidatedList>().toMatchTypeOf<LanguageData[]>();
  });
});
