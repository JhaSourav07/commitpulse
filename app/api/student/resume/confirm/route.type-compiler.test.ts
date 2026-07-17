import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';
import { resumeConfirmDataSchema, GITHUB_USERNAME_REGEX } from '@/lib/validations';

type ResumeConfirmData = z.infer<typeof resumeConfirmDataSchema>;

describe('Resume confirm schema - TypeScript compiler validation', () => {
  it('infers the correct TypeScript type', () => {
    expectTypeOf<ResumeConfirmData>().toMatchTypeOf<ResumeConfirmData>();
  });

  it('accepts minimal valid profile data', () => {
    const result = resumeConfirmDataSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
    });

    expect(result.success).toBe(true);
  });

  it('accepts optional fields without validation errors', () => {
    const result = resumeConfirmDataSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      skills: ['TypeScript', 'React'],
      education: [],
      experience: [],
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid schema values', () => {
    const result = resumeConfirmDataSchema.safeParse({
      name: '',
      email: 'invalid-email',
    });

    expect(result.success).toBe(false);
  });

  it('validates GitHub username format', () => {
    expect(GITHUB_USERNAME_REGEX.test('octocat')).toBe(true);
    expect(GITHUB_USERNAME_REGEX.test('john-doe')).toBe(true);

    expect(GITHUB_USERNAME_REGEX.test('john doe')).toBe(false);
    expect(GITHUB_USERNAME_REGEX.test('-octocat')).toBe(false);
    expect(GITHUB_USERNAME_REGEX.test('a'.repeat(40))).toBe(false);
  });
});
