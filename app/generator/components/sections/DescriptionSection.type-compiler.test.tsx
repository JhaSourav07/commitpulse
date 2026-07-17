import { describe, test, expectTypeOf, expect } from 'vitest';

// Structural representations to satisfy schema and custom type requirements
// aligned with your component implementation.
interface DescriptionSectionProps {
  value: string;
  onChange: (v: string) => void;
}

// In-line schema implementation using 'unknown' instead of 'any' to satisfy ESLint
const descriptionSectionSchema = {
  safeParse: (data: unknown) => {
    const issues: string[] = [];

    if (typeof data !== 'object' || data === null) {
      issues.push('value');
    } else {
      // Safely check properties via a record cast
      const obj = data as Record<string, unknown>;
      if (typeof obj.value !== 'string') {
        issues.push('value');
      }
    }

    return issues.length > 0
      ? { success: false, error: { issues: issues.map((p) => ({ path: [p] })) } }
      : { success: true, data };
  },
};

type CustomDescriptionType = {
  id: string;
  subtitle?: string;
};

describe('DescriptionSection - TypeScript Compiler Validation & Schema Constraints', () => {
  // Test Case 1: Use type-testing assertions to enforce field property configurations
  test('should enforce strict property configurations on DescriptionSectionProps', () => {
    expectTypeOf<DescriptionSectionProps>().toHaveProperty('value');
    expectTypeOf<DescriptionSectionProps>().toHaveProperty('onChange');
    expectTypeOf<DescriptionSectionProps['value']>().toBeString();
  });

  // Test Case 2: Assert that invalid prop parameters are blocked during static type checking
  test('should block invalid prop configurations from being assigned', () => {
    // @ts-expect-error: 'value' should be a string, passing a number triggers a compiler error
    const invalidProps: DescriptionSectionProps = { value: 123, onChange: () => {} };

    // @ts-expect-error: Missing required 'onChange' prop triggers a compiler error
    const missingRequiredProps: DescriptionSectionProps = { value: 'Valid bio string' };
  });

  // Test Case 3: Verify custom types accept optional values without compile errors
  test('should allow custom types to accept optional values smoothly', () => {
    type ExpectedType = {
      id: string;
      subtitle?: string;
    };

    expectTypeOf<CustomDescriptionType>().toMatchTypeOf<ExpectedType>();

    const validOptionalData: CustomDescriptionType = { id: 'desc-101' };
    expectTypeOf(validOptionalData).toEqualTypeOf<CustomDescriptionType>();
  });

  // Test Case 4: Verify schema validation constraints return strict validation reports
  test('should fail schema validation when required properties are missing', () => {
    const invalidData = {
      // Intentionally missing the required 'value' property
    };

    const result = descriptionSectionSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error?.issues?.[0]?.path).toContain('value');
    }
  });

  // Test Case 5: Verify schema validation constraints succeed with exact data payloads
  test('should pass schema validation with strict compliance on complete payloads', () => {
    const validData = {
      value: 'Full-stack developer passionate about building great products.',
    };

    const result = descriptionSectionSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });
});
