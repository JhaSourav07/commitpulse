import { describe, test, expectTypeOf } from 'vitest';
import type { ComponentProps, JSX } from 'react';
import ReturnToTop from './ReturnToTop';

describe('ReturnToTop Type Compiler & Schema Constraints Stability', () => {
  // Extract the props type inferred directly from the component function
  type ReturnToTopProps = ComponentProps<typeof ReturnToTop>;

  // Test Case 1: Enforce field property configurations
  test('should enforce correct field property configurations', () => {
    // Verifies that the component is typed properly and doesn't fallback to 'any'
    expectTypeOf<ReturnToTopProps>().not.toBeAny();
    expectTypeOf<typeof ReturnToTop>().toBeFunction();
  });

  // Test Case 2: Assert invalid prop parameters are blocked
  test('should block invalid prop parameters during static type checking', () => {
    // Check if 'invalidProp' exists in the keys of ReturnToTopProps
    type HasInvalidProp = 'invalidProp' extends keyof ReturnToTopProps ? true : false;

    // Explicitly assert that it must be false
    expectTypeOf<HasInvalidProp>().toEqualTypeOf<false>();
  });

  // Test Case 3: Verify custom types accept optional values without compile errors
  test('should accept empty or optional values without compile errors', () => {
    // Since ReturnToTop takes no required props, an empty object literal is valid
    const emptyProps: ReturnToTopProps = {};
    expectTypeOf(emptyProps).not.toBeUndefined();
  });

  // Test Case 4: Verify strict structural assignment
  test('should match the exact expected structure for ReturnToTop props', () => {
    // Evaluates if ReturnToTopProps is an empty object shape
    type IsEmptyObject = keyof ReturnToTopProps extends never ? true : false;

    // Confirms that the keys array length/union is strictly empty
    expectTypeOf<IsEmptyObject>().toEqualTypeOf<true>();
  });

  // Test Case 5: Verify schema boundaries and strict return validation constraints
  test('should enforce strict validation boundaries and explicit React component return types', () => {
    // Ensures the component returns a valid JSX element structure, enforcing strict React type constraints
    expectTypeOf<ReturnType<typeof ReturnToTop>>().toExtend<JSX.Element | null>();
    expectTypeOf<ReturnType<typeof ReturnToTop>>().not.toBeUnknown();
    expectTypeOf<ReturnType<typeof ReturnToTop>>().not.toBeAny();
  });
});
