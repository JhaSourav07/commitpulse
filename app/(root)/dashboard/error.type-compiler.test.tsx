import { expectTypeOf, test, describe } from 'vitest';
import DashboardError from './error';

// Re-create the inline props structure from error.tsx for precise type matching
type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

describe('DashboardError Type Compiler & Constraint Validation', () => {
  // 1. Enforce Field Property Configurations
  test('DashboardErrorProps should have correct field configurations', () => {
    expectTypeOf<DashboardErrorProps>().toHaveProperty('error');
    expectTypeOf<DashboardErrorProps>().toHaveProperty('reset');
    expectTypeOf<DashboardErrorProps['reset']>().toEqualTypeOf<() => void>();
  });

  // 2. Assert that Invalid Prop Parameters are Blocked during static type checking
  test('DashboardErrorProps should block invalid structural properties', () => {
    // Verifies that a type containing an extra invalid key does not match DashboardErrorProps
    expectTypeOf<{
      error: Error & { digest?: string };
      reset: () => void;
      invalidProp: string;
    }>().not.toEqualTypeOf<DashboardErrorProps>();
  });

  // 3. Verify Custom Types Accept Optional Values without compile errors
  test('DashboardErrorProps error digest field should accept optional values successfully', () => {
    type DigestType = DashboardErrorProps['error']['digest'];
    expectTypeOf<DigestType>().toEqualTypeOf<string | undefined>();
  });

  // 4. Schema/Structure Constraints (Strict matching on component parameter shape)
  test('DashboardError component parameter matches the strict expected props configuration', () => {
    // Verifies that the parameters passed to the component match the structural constraint type perfectly
    expectTypeOf<Parameters<typeof DashboardError>[0]>().toEqualTypeOf<DashboardErrorProps>();
  });

  // 5. Verification of Strict Object Parsing / Report compatibility
  test('Component props structure strictly reports unmapped properties', () => {
    // Verifies that an object missing the required 'reset' field fails to match the expected schema constraints
    expectTypeOf<{ error: Error & { digest?: string } }>().not.toEqualTypeOf<DashboardErrorProps>();
  });
});
