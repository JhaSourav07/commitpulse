import { describe, test, expectTypeOf } from 'vitest';
// Import the core object instance directly as the default export
import RefreshRateLimiter from './refresh-rate-limiter';

describe('TypeScript Compiler Validation & Schema Constraints Stability', () => {
  // Test 1: Verify the object has the expected functional properties directly on it
  test('RefreshRateLimiter should possess the expected method properties directly', () => {
    expectTypeOf(RefreshRateLimiter).toHaveProperty('setLimit');
    expectTypeOf(RefreshRateLimiter).toHaveProperty('checkLimit');
    expectTypeOf(RefreshRateLimiter).toHaveProperty('reset');
  });

  // Test 2: Assert methods are actual executable function structures
  test('RefreshRateLimiter operational methods should resolve as functions', () => {
    expectTypeOf(RefreshRateLimiter.setLimit).toBeFunction();
    expectTypeOf(RefreshRateLimiter.checkLimit).toBeFunction();
    expectTypeOf(RefreshRateLimiter.reset).toBeFunction();
  });

  // Test 3: Verify the singleton configuration strictly rejects invalid shapes
  test('RefreshRateLimiter should strictly reject invalid assignment shapes', () => {
    type MismatchedShape = { setLimit: string; checkLimit: boolean };
    expectTypeOf<MismatchedShape>().not.toMatchTypeOf<typeof RefreshRateLimiter>();
  });

  // Test 4: Verify the core module structural signature is defined and object-like
  test('RefreshRateLimiter structure matches an operational object contract', () => {
    expectTypeOf(RefreshRateLimiter).toBeObject();
    expectTypeOf(RefreshRateLimiter).not.toBeArray();
  });

  // Test 5: Verify constraint checks protect against missing required functionality
  test('Incomplete interface shapes must fail compatibility constraints', () => {
    type IncompleteLimiter = { setLimit: () => void };
    expectTypeOf<IncompleteLimiter>().not.toMatchTypeOf<typeof RefreshRateLimiter>();
  });
});
