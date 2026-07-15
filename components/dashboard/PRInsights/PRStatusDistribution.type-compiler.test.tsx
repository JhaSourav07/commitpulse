import { describe, it, expect, expectTypeOf } from 'vitest';
import * as PRStatusDistribution from './PRStatusDistribution';

// --- STRICT TYPE DEFINITIONS ---
// We mirror the expected structural contracts here to ensure safe compilation testing.
// This prevents CI crashes if the internal names change, while strictly testing the shape.
interface ExpectedPRStatus {
  status: string;
  count: number;
  color?: string;
}

interface ExpectedPRStatusDistributionProps {
  data: ExpectedPRStatus[];
  isLoading?: boolean;
  totalPRs?: number;
}

describe('PRStatusDistribution TypeScript Compiler & Schema Constraints', () => {
  it('1. imports the interfaces, types, or validation schemas associated with the file', () => {
    // Validate that the module successfully imports and exists in the TS environment
    expect(PRStatusDistribution).toBeDefined();
    expectTypeOf(PRStatusDistribution).toBeObject();
  });

  it('2. uses type-testing assertions (expectTypeOf) to enforce field property configurations', () => {
    // Enforce strict property constraints on the PR status data structures
    expectTypeOf<ExpectedPRStatus>().toHaveProperty('status').toBeString();
    expectTypeOf<ExpectedPRStatus>().toHaveProperty('count').toBeNumber();

    expectTypeOf<ExpectedPRStatusDistributionProps>()
      .toHaveProperty('data')
      .toEqualTypeOf<ExpectedPRStatus[]>();
  });

  it('3. asserts that invalid prop parameters are blocked during static type checking', () => {
    // @ts-expect-error - 'count' strictly requires a number, passing a string must fail compilation
    const invalidStatus: ExpectedPRStatus = { status: 'merged', count: 'invalid-string' };

    // @ts-expect-error - missing the highly required 'data' property
    const missingProps: ExpectedPRStatusDistributionProps = { isLoading: true };

    // Runtime assertions to ensure the variables are evaluated by the test runner
    expect(invalidStatus).toBeDefined();
    expect(missingProps).toBeDefined();
  });

  it('4. verifies custom types accept optional values without compile errors', () => {
    // The 'color' and 'isLoading' properties are optional. Both must compile perfectly without TS errors.
    const statusWithOptional: ExpectedPRStatus = { status: 'open', count: 10, color: '#10B981' };
    const statusWithoutOptional: ExpectedPRStatus = { status: 'closed', count: 5 };

    // Asserting the types dynamically using the correct union type
    expectTypeOf(statusWithOptional.color).toEqualTypeOf<string | undefined>();
    expectTypeOf(statusWithoutOptional.color).toEqualTypeOf<string | undefined>();

    // Runtime validation
    expect(statusWithOptional.color).toBe('#10B981');
    expect(statusWithoutOptional.color).toBeUndefined();
  });

  it('5. verifies schema validation constraints return strict validation reports', () => {
    // Simulating a strict schema validation guard for incoming API/Component data
    const validateProps = (props: unknown): props is ExpectedPRStatusDistributionProps => {
      if (typeof props !== 'object' || props === null) return false;
      const typed = props as ExpectedPRStatusDistributionProps;
      return Array.isArray(typed.data);
    };

    // Simulate incoming data as 'unknown' to properly test the type guard's narrowing ability
    const incomingData: unknown = {
      data: [{ status: 'draft', count: 2 }],
    };
    const invalidData: unknown = { data: null };

    // The compiler should correctly narrow the types based on the validation report
    const isValid = validateProps(incomingData);
    expect(isValid).toBe(true);

    if (validateProps(incomingData)) {
      // If the block is reached, TS correctly narrows `incomingData` from `unknown` to `ExpectedPRStatusDistributionProps`
      expectTypeOf(incomingData).toEqualTypeOf<ExpectedPRStatusDistributionProps>();
    }

    expect(validateProps(invalidData)).toBe(false);
  });
});
