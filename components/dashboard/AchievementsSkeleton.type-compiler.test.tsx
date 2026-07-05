import { describe, test, expectTypeOf } from 'vitest';
import React from 'react';
import AchievementsSkeleton from './AchievementsSkeleton';

describe('AchievementsSkeleton Type Compiler Validation', () => {
  // Test Case 1: Verify the component successfully compiles as a valid React functional component
  test('should compile as a valid React functional component returning a JSX Element', () => {
    expectTypeOf(AchievementsSkeleton).toBeFunction();
    expectTypeOf<
      ReturnType<typeof AchievementsSkeleton>
    >().toMatchTypeOf<React.ReactElement | null>();
  });

  // Test Case 2: Use type-testing assertions to enforce field property configurations (Component expects no props)
  test('should enforce strict property configurations requiring an empty object structural definition', () => {
    type Props = React.ComponentProps<typeof AchievementsSkeleton>;
    expectTypeOf<keyof Props>().toEqualTypeOf<never>();
  });

  // Test Case 3: Assert that invalid prop parameters are strictly blocked during static type checking
  test('should block invalid or extraneous prop parameters during static compilation', () => {
    // @ts-expect-error - Component does not accept an 'invalidProp' parameter
    const element = <AchievementsSkeleton invalidProp="error-test" />;
    expectTypeOf(element).not.toBeUndefined();
  });

  // Test Case 4: Verify custom types / extended props accept optional values without compile errors
  test('should successfully accept safe optional attributes if extended or intersected', () => {
    type ExtendedPropsTest = React.ComponentProps<typeof AchievementsSkeleton> & {
      className?: string;
    };
    expectTypeOf<ExtendedPropsTest>().toHaveProperty('className');
    expectTypeOf<ExtendedPropsTest['className']>().toEqualTypeOf<string | undefined>();
  });

  // Test Case 5: Verify strict evaluation of parameter structures / return signature stability
  test('should maintain a strict structural validation report on component parameters', () => {
    type Params = Parameters<typeof AchievementsSkeleton>;
    // Safely extract parameter keys via a conditional type to handle empty tuple definitions cleanly
    type SafeFirstParamKeys = Params extends [infer P, ...unknown[]] ? keyof P : never;

    expectTypeOf<SafeFirstParamKeys>().toEqualTypeOf<never>();
  });
});
