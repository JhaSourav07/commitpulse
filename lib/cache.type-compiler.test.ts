import { describe, test, expectTypeOf } from 'vitest';
import { LockConfig, TTLCache, DistributedCache } from './cache';

describe('Cache Type Compiler Validation & Schema Constraints Stability', () => {
  // Test Case 1: Use type-testing assertions (expectTypeOf) to enforce field property configurations
  test('LockConfig should strictly enforce correct property configurations and types', () => {
    expectTypeOf<LockConfig>().toHaveProperty('lockTtlMs');
    expectTypeOf<LockConfig>().toHaveProperty('maxPollTimeMs');
    expectTypeOf<LockConfig>().toHaveProperty('enableLockExtension');
    expectTypeOf<LockConfig>().toHaveProperty('releaseRetries');

    // Safe, direct indexed type validations to prevent property chaining bugs
    expectTypeOf<LockConfig['lockTtlMs']>().toMatchTypeOf<number | undefined>();
    expectTypeOf<LockConfig['maxPollTimeMs']>().toMatchTypeOf<number | undefined>();
    expectTypeOf<LockConfig['enableLockExtension']>().toMatchTypeOf<boolean | undefined>();
    expectTypeOf<LockConfig['releaseRetries']>().toMatchTypeOf<number | undefined>();
  });

  // Test Case 2: Assert that invalid prop parameters are blocked during static type checking
  test('LockConfig and class initializers should reject invalid structural parameters', () => {
    // LockConfig shouldn't match an object with wrong field value types
    expectTypeOf<{ lockTtlMs: string }>().not.toMatchTypeOf<LockConfig>();

    // Core structural properties shouldn't allow type widening or unexpected objects
    expectTypeOf<{ arbitraryProp: boolean }>().not.toMatchTypeOf<LockConfig>();
  });

  // Test Case 3: Verify custom types accept optional values without compile errors
  test('LockConfig should completely accept empty or optional parameters safely', () => {
    const minimalConfig: LockConfig = {};
    expectTypeOf(minimalConfig).toMatchTypeOf<LockConfig>();

    const partialConfig: LockConfig = { enableLockExtension: true };
    expectTypeOf(partialConfig).toMatchTypeOf<LockConfig>();
  });

  // Test Case 4: Verify schema validation constraints / generics structure stability for TTLCache
  test('TTLCache class instance methods should strictly enforce signature types', () => {
    type StringCache = TTLCache<string>;

    // Verify method parameter configurations using indexed lookup signatures
    expectTypeOf<StringCache['get']>().parameter(0).toBeString();
    expectTypeOf<StringCache['get']>().returns.toMatchTypeOf<string | null>();

    expectTypeOf<StringCache['set']>().parameter(0).toBeString();
    expectTypeOf<StringCache['set']>().parameter(1).toBeString(); // value must match T (string)
    expectTypeOf<StringCache['set']>().parameter(2).toBeNumber(); // ttlMs must be a number
  });

  // Test Case 5: Verify distributed layer schema validation constraints and generic signature returns
  test('DistributedCache should securely wrap asynchronous returns and reject mismatched payloads', () => {
    type NumberCache = DistributedCache<number>;

    // Ensure asynchronous operations encapsulate types inside native Promise instances
    expectTypeOf<NumberCache['get']>().returns.toEqualTypeOf<Promise<number | null>>();
    expectTypeOf<NumberCache['incr']>().returns.toEqualTypeOf<Promise<number>>();

    // Changed (cached: any) to (cached: number | null) or unknown to comply with ESLint constraints
    expectTypeOf<NumberCache['getOrSet']>()
      .parameter(1)
      .not.toMatchTypeOf<(cached: number | null) => Promise<string>>();
  });
});
