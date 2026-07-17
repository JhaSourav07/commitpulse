import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';
import { getSocialById } from './socials';
import type { Social, SocialCategory, IconType } from '../types';

interface ZodUnrecognizedKeysIssue {
  code: 'unrecognized_keys';
  keys: string[];
}

describe('TypeScript Compiler Validation & Schema Constraints Stability (Variation 10)', () => {
  // Case 1: Use type-testing assertions (expectTypeOf) to enforce field property configurations.
  it('enforces core field property configurations on Social type', () => {
    expectTypeOf<Social>().toHaveProperty('id').toBeString();
    expectTypeOf<Social>().toHaveProperty('name').toBeString();
    expectTypeOf<Social>().toHaveProperty('category').toEqualTypeOf<SocialCategory>();
    expectTypeOf<Social>().toHaveProperty('iconUrl').toBeString();
    expectTypeOf<Social>().toHaveProperty('type').toEqualTypeOf<IconType>();
    expectTypeOf<Social>().toHaveProperty('baseUrl').toBeString();
    expectTypeOf<Social>().toHaveProperty('placeholder').toBeString();
  });

  // Case 2: Assert that invalid prop parameters are blocked during static type checking.
  it('blocks invalid prop parameters during static type checking', () => {
    type InvalidCategory = Omit<Social, 'category'> & { category: 'InvalidCategory' };
    type InvalidType = Omit<Social, 'type'> & { type: 'customicon' };
    type MissingId = Omit<Social, 'id'>;

    expectTypeOf<InvalidCategory>().not.toMatchTypeOf<Social>();
    expectTypeOf<InvalidType>().not.toMatchTypeOf<Social>();
    expectTypeOf<MissingId>().not.toMatchTypeOf<Social>();
  });

  // Case 3: Verify custom types accept optional values without compile errors.
  it('verifies custom types accept optional values without compile errors', () => {
    const socialWithoutSlug: Social = {
      id: 'custom-social',
      name: 'Custom Social',
      category: 'Portfolio',
      iconUrl: 'https://example.com/icon.svg',
      type: 'simpleicon',
      baseUrl: 'https://example.com/',
      placeholder: 'e.g. https://example.com/yourusername',
    };

    const socialWithSlug: Social = {
      ...socialWithoutSlug,
      siSlug: 'example',
    };

    expectTypeOf<Social['siSlug']>().toEqualTypeOf<string | undefined>();
    expect(socialWithoutSlug.siSlug).toBeUndefined();
    expect(socialWithSlug.siSlug).toBe('example');
  });

  // Case 4: Verify schema validation constraints return strict validation reports.
  it('verify schema validation constraints return strict validation reports', () => {
    const socialSchema = z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
        category: z.enum([
          'Social Media',
          'Developer',
          'Competitive Programming',
          'Professional',
          'Streaming',
          'Contact',
          'Portfolio',
          'Support',
        ]),
        iconUrl: z.string().url(),
        type: z.enum(['devicon', 'simpleicon']),
        baseUrl: z.string().min(1),
        placeholder: z.string().min(1),
        siSlug: z.string().optional(),
      })
      .strict();

    const invalidPayload = {
      id: '',
      name: 'Test',
      category: 'NonExistentCategory',
      iconUrl: 'not-a-url',
      type: 'invalidicon',
      baseUrl: '',
      placeholder: '',
      extraField: 'not-allowed',
    };

    const result = socialSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0]).filter(Boolean);
      expect(paths).toContain('id');
      expect(paths).toContain('category');
      expect(paths).toContain('iconUrl');
      expect(paths).toContain('type');

      const hasExtraFieldIssue = result.error.issues.some(
        (issue) =>
          issue.code === 'unrecognized_keys' &&
          (issue as unknown as ZodUnrecognizedKeysIssue).keys.includes('extraField')
      );
      expect(hasExtraFieldIssue).toBe(true);
    }
  });

  // Case 5: Verify correct payloads safely clear validation limits.
  it('verifies that valid social items safely pass schema validation', () => {
    const socialSchema = z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      category: z.enum([
        'Social Media',
        'Developer',
        'Competitive Programming',
        'Professional',
        'Streaming',
        'Contact',
        'Portfolio',
        'Support',
      ]),
      iconUrl: z.string().url(),
      type: z.enum(['devicon', 'simpleicon']),
      baseUrl: z.string().min(1),
      placeholder: z.string().min(1),
      siSlug: z.string().optional(),
    });

    const githubSocial = getSocialById('github');
    expect(githubSocial).toBeDefined();

    if (githubSocial) {
      const result = socialSchema.safeParse(githubSocial);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('github');
        expect(result.data.name).toBe('GitHub');
        expect(result.data.category).toBe('Developer');
      }
    }
  });
});
