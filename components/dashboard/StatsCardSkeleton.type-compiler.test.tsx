import { describe, it, expectTypeOf } from 'vitest';
import StatsCardSkeleton from './StatsCardSkeleton';
import type { ComponentType, ReactElement } from 'react';

describe('StatsCardSkeleton Type Compiler Validation', () => {
  // 1. Import and validate all exported interfaces/types using expectTypeOf.
  it('1. should validate the default export component signature and type', () => {
    // Assert that StatsCardSkeleton is a function component
    expectTypeOf(StatsCardSkeleton).toBeFunction();
    expectTypeOf(StatsCardSkeleton).toBeCallableWith();

    // Assert it returns a ReactElement
    expectTypeOf<ReturnType<typeof StatsCardSkeleton>>().toMatchTypeOf<ReactElement>();
  });

  // 2. Verify required properties remain required and optional properties remain optional.
  it('2. should verify prop parameters are strict and have expected requirement constraints', () => {
    // StatsCardSkeleton takes no props.
    // Assert that the component's first parameter type is empty or assigns to an empty object
    expectTypeOf<Parameters<typeof StatsCardSkeleton>>().toEqualTypeOf<[]>();
  });

  // 3. Assert invalid prop shapes or incompatible types are rejected at compile time using // @ts-expect-error.
  it('3. should reject invalid prop shapes and arguments at compile time', () => {
    // Using @ts-expect-error to verify compiler constraints reject arbitrary prop arguments
    // @ts-expect-error - StatsCardSkeleton does not accept any arguments
    const result = StatsCardSkeleton({ invalidProp: 'value' });
    expectTypeOf(result).toMatchTypeOf<ReactElement>();

    // @ts-expect-error - StatsCardSkeleton does not accept number parameter
    const resultNum = StatsCardSkeleton(42);
    expectTypeOf(resultNum).toMatchTypeOf<ReactElement>();
  });

  // 4. Verify optional values, partial objects, or undefined-compatible fields compile successfully.
  it('4. should compile successfully when invoked with no arguments', () => {
    const element = StatsCardSkeleton();
    expectTypeOf(element).toMatchTypeOf<ReactElement>();
  });

  // 5. Validate any associated schemas or type constraints remain stable and enforce expected field configurations.
  it('5. should enforce that StatsCardSkeleton is assignable to standard React component type constraints', () => {
    // Assert it matches standard React component type constraints
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    expectTypeOf<typeof StatsCardSkeleton>().toMatchTypeOf<ComponentType<{}>>();
    expectTypeOf<typeof StatsCardSkeleton>().toMatchTypeOf<() => ReactElement>();
  });
});
