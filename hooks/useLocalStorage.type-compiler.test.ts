import { describe, test, expectTypeOf } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('TypeScript Compiler Validation & Schema Constraints Stability', () => {
  test('useLocalStorage should match the expected generic hook contract', () => {
    type UseLocalStorageSignature = <T>(
      key: string,
      initialValue: T
    ) => readonly [T, (value: T) => void];

    expectTypeOf(useLocalStorage).toMatchTypeOf<UseLocalStorageSignature>();
  });

  test('useLocalStorage should support primitive value contracts', () => {
    type PrimitiveReturn = ReturnType<typeof useLocalStorage<string>>;
    expectTypeOf<PrimitiveReturn>().toEqualTypeOf<readonly [string, (value: string) => void]>();
  });

  test('useLocalStorage should preserve object field property configurations', () => {
    type User = {
      name: string;
      score: number;
      isPro: boolean;
    };

    type UserReturn = ReturnType<typeof useLocalStorage<User>>;

    expectTypeOf<UserReturn>().toEqualTypeOf<readonly [User, (value: User) => void]>();
  });

  test('useLocalStorage should accept custom types with optional values', () => {
    type Preferences = {
      theme: string;
      fontSize?: number;
      compactMode?: boolean;
    };

    type PreferencesReturn = ReturnType<typeof useLocalStorage<Preferences>>;

    expectTypeOf<PreferencesReturn>().toEqualTypeOf<
      readonly [Preferences, (value: Preferences) => void]
    >();
  });

  test('useLocalStorage setter contract should reject incompatible function shapes', () => {
    type CountReturn = ReturnType<typeof useLocalStorage<number>>;
    type CountSetter = CountReturn[1];
    type InvalidSetter = (value: string) => void;

    expectTypeOf<InvalidSetter>().not.toMatchTypeOf<CountSetter>();
  });
});
