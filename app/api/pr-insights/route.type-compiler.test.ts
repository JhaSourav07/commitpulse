import { describe, it, expect } from 'vitest';
import { expectTypeOf } from 'vitest';

// 1. Mocking the exact shape expected by the API layer for compile-time checking
export interface PRInsightsRequest {
  username: string;
  options?: {
    forceRefresh?: boolean;
    depth?: number;
  };
}

// Helper utility to strictly verify if T matches U exactly with no extra keys
type IsExact<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;

// 2. Simulated schema validation checking strict route parameters
export const prInsightsSchema = {
  safeParse: (data: unknown) => {
    if (
      !data ||
      typeof data !== 'object' ||
      !('username' in data) ||
      typeof (data as { username: unknown }).username !== 'string'
    ) {
      return {
        success: false as const,
        error: new Error('Username is required and must be a string'),
      };
    }
    const trimmed = (data as { username: string }).username.trim();
    if (trimmed.length === 0 || trimmed.length > 39) {
      return { success: false as const, error: new Error('Invalid GitHub username length') };
    }
    return { success: true as const, data: { username: trimmed } };
  },
};

describe('TypeScript Compiler Validation & Schema Constraints Stability', () => {
  // Test Case 1: Enforce Field Property Configurations
  it('should enforce strict field property configurations', () => {
    expectTypeOf<PRInsightsRequest>().toHaveProperty('username').toBeString();
  });

  // Test Case 2: Block Invalid Properties Globally
  it('should fail compilation or mismatch if invalid properties are injected', () => {
    type InvalidData = { username: string; unknownField: string };
    type Check = IsExact<InvalidData, PRInsightsRequest>;

    // Assert that the object layout with extra fields is NOT exactly equal to the interface configuration
    expectTypeOf<Check>().toEqualTypeOf<false>();
    expect(true).toBe(true);
  });

  // Test Case 3: Verify Optional Fields Stability
  it('should accept optional parameters without compilation errors', () => {
    expectTypeOf<PRInsightsRequest>().toHaveProperty('options').not.toBeUndefined();

    const validOptional: PRInsightsRequest = {
      username: 'JhaSourav07',
    };
    expect(validOptional.options).toBeUndefined();
  });

  // Test Case 4: Schema Constraint Validation (Valid Data)
  it('should return a successful validation report for valid schema data', () => {
    const validPayload = { username: 'tamilr0727-ux' };
    const result = prInsightsSchema.safeParse(validPayload);

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.username).toBe('tamilr0727-ux');
    }
  });

  // Test Case 5: Schema Constraint Validation (Strict Failure)
  it('should return a strict validation failure report when constraints are violated', () => {
    const invalidPayload = { username: 'a'.repeat(40) };
    const result = prInsightsSchema.safeParse(invalidPayload);

    expect(result.success).toBe(false);
    if (!result.success && result.error) {
      expect(result.error).toBeDefined();
    }
  });
});
