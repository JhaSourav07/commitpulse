import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';
import { getTechById } from './technologies';
import type { Technology, TechCategory, IconType } from '../types';

interface ZodUnrecognizedKeysIssue {
  code: 'unrecognized_keys';
  keys: string[];
}

describe('TypeScript Compiler Validation & Schema Constraints Stability (Variation 10)', () => {
  // Case 1: Use type-testing assertions (expectTypeOf) to enforce field property configurations.
  it('enforces core field property configurations on Technology type', () => {
    expectTypeOf<Technology>().toHaveProperty('id').toBeString();
    expectTypeOf<Technology>().toHaveProperty('name').toBeString();
    expectTypeOf<Technology>().toHaveProperty('category').toEqualTypeOf<TechCategory>();
    expectTypeOf<Technology>().toHaveProperty('iconUrl').toBeString();
    expectTypeOf<Technology>().toHaveProperty('type').toEqualTypeOf<IconType>();
  });

  // Case 2: Assert that invalid prop parameters are blocked during static type checking.
  it('blocks invalid prop parameters during static type checking', () => {
    type InvalidCategory = Omit<Technology, 'category'> & { category: 'InvalidCategory' };
    type InvalidType = Omit<Technology, 'type'> & { type: 'customicon' };
    type MissingId = Omit<Technology, 'id'>;

    expectTypeOf<InvalidCategory>().not.toMatchTypeOf<Technology>();
    expectTypeOf<InvalidType>().not.toMatchTypeOf<Technology>();
    expectTypeOf<MissingId>().not.toMatchTypeOf<Technology>();
  });

  // Case 3: Verify custom types accept optional values without compile errors.
  it('verifies custom types accept optional values without compile errors', () => {
    type CustomOptionalTech = Omit<Technology, 'iconUrl' | 'type'> & {
      iconUrl?: string;
      type?: IconType;
    };

    const techWithOptional: CustomOptionalTech = {
      id: 'custom-tech',
      name: 'Custom Tech',
      category: 'Languages',
    };

    expectTypeOf<CustomOptionalTech>().toMatchTypeOf<Partial<Technology>>();
    expect(techWithOptional.iconUrl).toBeUndefined();
    expect(techWithOptional.type).toBeUndefined();
  });

  // Case 4: Verify schema validation constraints return strict validation reports.
  it('verify schema validation constraints return strict validation reports', () => {
    const technologySchema = z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
        category: z.enum([
          'Languages',
          'Frontend',
          'UI Libraries',
          'Backend',
          'Mobile',
          'Database',
          'ORM & Query',
          'Cloud',
          'DevOps',
          'Tools & IDEs',
          'AI & ML',
          'Design',
          'Other',
        ]),
        iconUrl: z.string().url(),
        type: z.enum(['devicon', 'simpleicon']),
      })
      .strict();

    const invalidPayload = {
      id: '',
      name: 'Test',
      category: 'NonExistentCategory',
      iconUrl: 'not-a-url',
      type: 'invalidicon',
      extraField: 'not-allowed',
    };

    const result = technologySchema.safeParse(invalidPayload);
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
  it('verifies that valid technology items safely pass schema validation', () => {
    const technologySchema = z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      category: z.enum([
        'Languages',
        'Frontend',
        'UI Libraries',
        'Backend',
        'Mobile',
        'Database',
        'ORM & Query',
        'Cloud',
        'DevOps',
        'Tools & IDEs',
        'AI & ML',
        'Design',
        'Other',
      ]),
      iconUrl: z.string().url(),
      type: z.enum(['devicon', 'simpleicon']),
    });

    const jsTech = getTechById('javascript');
    expect(jsTech).toBeDefined();

    if (jsTech) {
      const result = technologySchema.safeParse(jsTech);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('javascript');
        expect(result.data.name).toBe('JavaScript');
        expect(result.data.category).toBe('Languages');
      }
    }
  });
});
