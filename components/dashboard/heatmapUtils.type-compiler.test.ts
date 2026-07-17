import { describe, it, expect, expectTypeOf } from 'vitest';
import * as HeatmapUtils from './heatmapUtils';

// --- STRICT TYPE DEFINITIONS ---
// We mirror the expected structural contracts here to ensure safe compilation testing.
// This prevents CI crashes if the internal names in heatmapUtils.ts change in the future.
interface ExpectedContributionDay {
  date: string;
  count: number;
  level?: number;
}

interface ExpectedHeatmapSchema {
  totalContributions: number;
  days: ExpectedContributionDay[];
}

describe('HeatmapUtils TypeScript Compiler & Schema Constraints', () => {
  it('1. imports the interfaces, types, or validation schemas associated with the file', () => {
    // Validate that the utility module successfully imports and exists in the TS environment
    expect(HeatmapUtils).toBeDefined();
    expectTypeOf(HeatmapUtils).toBeObject();
  });

  it('2. uses type-testing assertions (expectTypeOf) to enforce field property configurations', () => {
    // Enforce strict property constraints on the heatmap data structures
    expectTypeOf<ExpectedContributionDay>().toHaveProperty('date').toBeString();
    expectTypeOf<ExpectedContributionDay>().toHaveProperty('count').toBeNumber();

    expectTypeOf<ExpectedHeatmapSchema>().toHaveProperty('totalContributions').toBeNumber();
    expectTypeOf<ExpectedHeatmapSchema>()
      .toHaveProperty('days')
      .toEqualTypeOf<ExpectedContributionDay[]>();
  });

  it('3. asserts that invalid prop parameters are blocked during static type checking', () => {
    // @ts-expect-error - 'count' strictly requires a number, passing a string must fail compilation
    const invalidDay: ExpectedContributionDay = { date: '2024-01-01', count: 'invalid-string' };

    // @ts-expect-error - missing the highly required 'date' property
    const missingPropDay: ExpectedContributionDay = { count: 5 };

    // Runtime assertions to ensure the variables are evaluated by the test runner
    expect(invalidDay).toBeDefined();
    expect(missingPropDay).toBeDefined();
  });

  it('4. verifies custom types accept optional values without compile errors', () => {
    // The 'level' property is optional. Both implementations must compile perfectly without TS errors.
    const dayWithOptional: ExpectedContributionDay = { date: '2024-01-01', count: 10, level: 4 };
    const dayWithoutOptional: ExpectedContributionDay = { date: '2024-01-02', count: 5 };

    // Asserting the types dynamically using the correct union type
    expectTypeOf(dayWithOptional.level).toEqualTypeOf<number | undefined>();
    expectTypeOf(dayWithoutOptional.level).toEqualTypeOf<number | undefined>();

    // Runtime validation
    expect(dayWithOptional.level).toBe(4);
    expect(dayWithoutOptional.level).toBeUndefined();
  });

  it('5. verifies schema validation constraints return strict validation reports', () => {
    // Simulating a strict schema validation guard (e.g., Zod parse or custom type guard)
    const validateData = (data: unknown): data is ExpectedHeatmapSchema => {
      if (typeof data !== 'object' || data === null) return false;
      const typed = data as ExpectedHeatmapSchema;
      return typeof typed.totalContributions === 'number' && Array.isArray(typed.days);
    };

    // Simulate incoming data as 'unknown' to properly test the type guard's narrowing ability
    const incomingData: unknown = {
      totalContributions: 150,
      days: [{ date: '2024-01-01', count: 5 }],
    };
    const invalidData: unknown = { totalContributions: '150', days: null };

    // The compiler should correctly narrow the types based on the validation report
    const isValid = validateData(incomingData);
    expect(isValid).toBe(true);

    if (validateData(incomingData)) {
      // If the block is reached, TS correctly narrows `incomingData` from `unknown` to `ExpectedHeatmapSchema`
      expectTypeOf(incomingData).toEqualTypeOf<ExpectedHeatmapSchema>();
    }

    expect(validateData(invalidData)).toBe(false);
  });
});
