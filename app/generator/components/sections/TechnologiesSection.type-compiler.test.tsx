/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, expectTypeOf, it, expect } from 'vitest';
import { z } from 'zod';
import type { ComponentProps } from 'react';
import { TechnologiesSection } from './TechnologiesSection';
import type { Technology, TechCategory, IconType, Social } from '../../types';
import { TECHNOLOGIES } from '../../data/technologies';

type TechnologiesSectionProps = ComponentProps<typeof TechnologiesSection>;

describe('TechnologiesSection Type Compiler Validation (Variation 10)', () => {
  // 1. Validate exported interfaces and component prop types using expectTypeOf.
  it('1. validates exported interfaces and component prop types correctly', () => {
    // Assert TechnologiesSection is a function/component
    expectTypeOf(TechnologiesSection).toBeFunction();

    // Validate component prop types structure
    expectTypeOf<TechnologiesSectionProps>().toBeObject();
    expectTypeOf<TechnologiesSectionProps['selected']>().toEqualTypeOf<string[]>();
    expectTypeOf<TechnologiesSectionProps['onChange']>().toEqualTypeOf<(ids: string[]) => void>();

    // Validate parameters of onChange prop
    expectTypeOf<Parameters<TechnologiesSectionProps['onChange']>[0]>().toEqualTypeOf<string[]>();
    expectTypeOf<ReturnType<TechnologiesSectionProps['onChange']>>().toEqualTypeOf<void>();

    // Validate Technology and related types structure
    expectTypeOf<Technology>().toBeObject();
    expectTypeOf<Technology['id']>().toBeString();
    expectTypeOf<Technology['name']>().toBeString();
    expectTypeOf<Technology['category']>().toEqualTypeOf<TechCategory>();
    expectTypeOf<Technology['iconUrl']>().toBeString();
    expectTypeOf<Technology['type']>().toEqualTypeOf<IconType>();
  });

  // 2. Verify required properties remain required and optional properties remain optional.
  it('2. verifies required properties remain required and optional properties remain optional', () => {
    // Check required properties of TechnologiesSectionProps using Required utility
    expectTypeOf<Required<TechnologiesSectionProps>>().toEqualTypeOf<TechnologiesSectionProps>();
    expectTypeOf<TechnologiesSectionProps['selected']>().not.toBeUndefined();
    expectTypeOf<TechnologiesSectionProps['onChange']>().not.toBeUndefined();

    // Check required properties of Technology
    expectTypeOf<Required<Technology>>().toEqualTypeOf<Technology>();

    // Verify optional properties on Social type remain optional (can be undefined)
    expectTypeOf<Social['siSlug']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<Required<Social>>().not.toEqualTypeOf<Social>();
  });

  // 3. Assert invalid prop shapes or incompatible types are rejected at compile time using // @ts-expect-error.
  it('3. asserts invalid prop shapes or incompatible types are rejected at compile time', () => {
    const invalidSelected: TechnologiesSectionProps = {
      // @ts-expect-error - selected cannot be a number array
      selected: [1, 2, 3],
      onChange: () => {},
    };

    const invalidOnChange: TechnologiesSectionProps = {
      selected: ['react'],
      // @ts-expect-error - onChange must accept string[]
      onChange: (ids: number[]) => {},
    };

    // @ts-expect-error - missing required onChange prop
    const missingOnChange: TechnologiesSectionProps = {
      selected: ['react'],
    };

    // @ts-expect-error - missing required selected prop
    const missingSelected: TechnologiesSectionProps = {
      onChange: () => {},
    };

    const invalidTechnology: Technology = {
      id: 'custom-tech',
      name: 'Custom',
      // @ts-expect-error - category must be a valid TechCategory, not an arbitrary string
      category: 'InvalidCategoryName',
      iconUrl: 'https://example.com/icon.svg',
      type: 'devicon',
    };
  });

  // 4. Verify optional values, partial objects, and undefined-compatible fields compile successfully.
  it('4. verifies optional values, partial objects, and undefined-compatible fields compile successfully', () => {
    // Verify Partial utility is compatible and compiles cleanly
    type PartialProps = Partial<TechnologiesSectionProps>;
    const partialProps: PartialProps = {
      selected: ['typescript'],
    };

    expectTypeOf(partialProps.selected).toEqualTypeOf<string[] | undefined>();
    expectTypeOf(partialProps.onChange).toEqualTypeOf<((ids: string[]) => void) | undefined>();

    // Verify Social partial objects compile successfully with undefined properties
    const partialSocial: Partial<Social> = {
      id: 'github',
      name: 'GitHub',
    };
    expectTypeOf(partialSocial.siSlug).toEqualTypeOf<string | undefined>();
    expectTypeOf(partialSocial.baseUrl).toEqualTypeOf<string | undefined>();
  });

  // 5. Validate associated schemas or type constraints remain stable and enforce expected field configurations.
  it('5. validates associated schemas and type constraints enforce expected field configurations', () => {
    // Define strict schema enforcing the exact Technology interface rules
    const technologySchema = z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
        category: z.union([
          z.literal('Languages'),
          z.literal('Frontend'),
          z.literal('UI Libraries'),
          z.literal('Backend'),
          z.literal('Mobile'),
          z.literal('Database'),
          z.literal('ORM & Query'),
          z.literal('Cloud'),
          z.literal('DevOps'),
          z.literal('Tools & IDEs'),
          z.literal('AI & ML'),
          z.literal('Design'),
          z.literal('Other'),
        ]),
        iconUrl: z.string().url(),
        type: z.union([z.literal('devicon'), z.literal('simpleicon')]),
      })
      .strict();

    // Verify standard/mock data from the dataset passes the schema
    const firstTech = TECHNOLOGIES[0];
    const parseResult = technologySchema.safeParse(firstTech);
    expect(parseResult.success).toBe(true);

    if (parseResult.success) {
      // Confirm the parsed schema shape matches the Technology type
      type ParsedTechnology = z.infer<typeof technologySchema>;
      expectTypeOf<ParsedTechnology>().toMatchTypeOf<Technology>();
    }

    // Verify invalid structures fail validation with specific error patterns
    const invalidTech = {
      id: 'invalid-tech',
      name: 'Invalid Tech',
      category: 'NotACategory', // Invalid literal
      iconUrl: 'not-a-url', // Invalid URL format
      type: 'invalid-type', // Invalid literal
      extraField: 'unexpected-data', // Strict check rejection
    };

    const failedResult = technologySchema.safeParse(invalidTech);
    expect(failedResult.success).toBe(false);

    if (!failedResult.success) {
      const fieldErrors = failedResult.error.flatten().fieldErrors;
      expect(fieldErrors).toHaveProperty('category');
      expect(fieldErrors).toHaveProperty('iconUrl');
      expect(fieldErrors).toHaveProperty('type');

      const unrecognizedKeys = failedResult.error.issues.some(
        (issue) => issue.code === 'unrecognized_keys' && issue.keys.includes('extraField')
      );
      expect(unrecognizedKeys).toBe(true);
    }
  });
});
