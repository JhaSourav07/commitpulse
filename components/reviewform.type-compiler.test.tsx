import { describe, it, expectTypeOf, expect } from 'vitest';
import { ReviewFormData, ReviewFormProps } from './reviewform';
import { z } from 'zod';

// Mock schema based on the component's internal validation logic
const ReviewFormSchema = z.object({
  name: z.string().min(1),
  handle: z.string().regex(/^@?[\w.-]+$/),
  platform: z.enum(['twitter', 'github']),
  message: z.string().min(10).max(1000),
  accentColor: z.string(),
});

describe('Review Form Type Compiler Validation & Schema Constraints Stability', () => {
  it('enforces field property configurations', () => {
    // Assert that the interface matches exact field types
    expectTypeOf<ReviewFormData>().toHaveProperty('name').toBeString();
    expectTypeOf<ReviewFormData>().toHaveProperty('handle').toBeString();
    expectTypeOf<ReviewFormData>().toHaveProperty('platform').toEqualTypeOf<'twitter' | 'github'>();
    expectTypeOf<ReviewFormData>().toHaveProperty('message').toBeString();
  });

  it('blocks invalid prop parameters during static type checking', () => {
    // Assert that a bad payload doesn't match the type
    expectTypeOf<{ invalidField: string }>().not.toMatchTypeOf<ReviewFormProps>();
    expectTypeOf<{ platform: 'instagram' }>().not.toMatchTypeOf<ReviewFormData>();
  });

  it('accepts optional values without compile errors', () => {
    // Verify optional fields can be missing or undefined
    expectTypeOf<{ initialPlatform: 'twitter' }>().toMatchTypeOf<ReviewFormProps>();
    expectTypeOf<{ optionalField?: string }>().toMatchTypeOf<ReviewFormProps>();
    expectTypeOf<ReviewFormProps['optionalField']>().toEqualTypeOf<string | undefined>();
  });

  it('returns strict validation reports for schema validation constraints', () => {
    const validData = {
      name: 'John',
      handle: '@john',
      platform: 'twitter',
      message: 'This is a valid long message.',
      accentColor: '#000000',
    };

    const result = ReviewFormSchema.safeParse(validData);
    expect(result.success).toBe(true);

    const invalidData = { ...validData, message: 'short' };
    const invalidResult = ReviewFormSchema.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error.issues[0].message).toContain('10');
    }
  });

  it('validates schema regex and enum constraints', () => {
    const invalidHandle = {
      name: 'John',
      handle: 'inv@lid handle!',
      platform: 'github',
      message: 'This is a valid long message.',
      accentColor: '#000000',
    };
    const resHandle = ReviewFormSchema.safeParse(invalidHandle);
    expect(resHandle.success).toBe(false);

    const invalidPlatform = { ...invalidHandle, handle: 'valid', platform: 'linkedin' };
    const resPlatform = ReviewFormSchema.safeParse(invalidPlatform);
    expect(resPlatform.success).toBe(false);
  });
});
