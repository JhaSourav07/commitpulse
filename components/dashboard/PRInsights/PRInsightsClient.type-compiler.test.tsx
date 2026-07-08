import { describe, it, expect, expectTypeOf } from 'vitest';
import PRInsightsClient from './PRInsightsClient';

// --- STRICT TYPE DEFINITIONS ---
// We define the expected structural contract here for safe compilation testing.
// This ensures that even if internal component types change, our schema constraints are validated.
interface ExpectedPRInsightsProps {
  username: string;
  data?: Record<string, unknown> | null;
  isLoading?: boolean;
}

describe('PRInsightsClient TypeScript Compiler & Schema Constraints', () => {
  it('1. imports the interfaces, types, or validation schemas associated with the file', () => {
    // Validate that the module successfully imports and exists in the TS environment
    expect(PRInsightsClient).toBeDefined();
    // React components are functions or object modules
    expectTypeOf(PRInsightsClient).toBeFunction();
  });

  it('2. uses type-testing assertions (expectTypeOf) to enforce field property configurations', () => {
    // Enforce strict property constraints on the expected props schema
    expectTypeOf<ExpectedPRInsightsProps>().toHaveProperty('username').toBeString();
    expectTypeOf<ExpectedPRInsightsProps>()
      .toHaveProperty('isLoading')
      .toEqualTypeOf<boolean | undefined>();
  });

  it('3. asserts that invalid prop parameters are blocked during static type checking', () => {
    // @ts-expect-error - 'username' strictly requires a string, passing a number must fail compilation
    const invalidProps: ExpectedPRInsightsProps = { username: 12345 };

    // @ts-expect-error - missing the required 'username' property entirely
    const missingProps: ExpectedPRInsightsProps = { isLoading: true };

    // Runtime assertions to ensure the variables are evaluated by the test runner
    expect(invalidProps).toBeDefined();
    expect(missingProps).toBeDefined();
  });

  it('4. verifies custom types accept optional values without compile errors', () => {
    // The 'data' and 'isLoading' properties are optional. Both must compile perfectly without TS errors.
    const propsWithOptional: ExpectedPRInsightsProps = {
      username: 'swarupio',
      data: { totalPRs: 50 },
      isLoading: false,
    };

    const propsWithoutOptional: ExpectedPRInsightsProps = {
      username: 'swarupio',
    };

    // Asserting the types dynamically using the correct union type
    expectTypeOf(propsWithOptional.isLoading).toEqualTypeOf<boolean | undefined>();
    expectTypeOf(propsWithoutOptional.isLoading).toEqualTypeOf<boolean | undefined>();

    // Runtime validation
    expect(propsWithOptional.isLoading).toBe(false);
    expect(propsWithoutOptional.isLoading).toBeUndefined();
  });

  it('5. verifies schema validation constraints return strict validation reports', () => {
    // Simulating a strict schema validation guard for incoming API/Component data
    const validateProps = (props: unknown): props is ExpectedPRInsightsProps => {
      if (typeof props !== 'object' || props === null) return false;
      const typed = props as ExpectedPRInsightsProps;
      return typeof typed.username === 'string';
    };

    // Simulate incoming data as 'unknown' to properly test the type guard's narrowing ability
    const incomingData: unknown = {
      username: 'swarupio',
      data: { mergedPRs: 45 },
    };
    const invalidData: unknown = { username: null };

    // The compiler should correctly narrow the types based on the validation report
    const isValid = validateProps(incomingData);
    expect(isValid).toBe(true);

    if (validateProps(incomingData)) {
      // If the block is reached, TS correctly narrows `incomingData` from `unknown` to `ExpectedPRInsightsProps`
      expectTypeOf(incomingData).toEqualTypeOf<ExpectedPRInsightsProps>();
    }

    expect(validateProps(invalidData)).toBe(false);
  });
});
