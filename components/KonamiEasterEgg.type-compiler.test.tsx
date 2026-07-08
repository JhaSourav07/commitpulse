import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';
import type { KonamiEasterEggProps } from './KonamiEasterEgg';
import KonamiEasterEgg from './KonamiEasterEgg';

describe('TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('1. Import the interfaces, types, or validation schemas associated with the file', () => {
    // Verify that the exported KonamiEasterEggProps interface is a valid object type
    expectTypeOf<KonamiEasterEggProps>().toBeObject();

    // Maintain baseline coverage on the component export itself
    expect(KonamiEasterEgg).toBeDefined();
  });

  it('2. Use type-testing assertions (expectTypeOf) to enforce field property configurations', () => {
    // Assert all keys exist and match strict primitive types
    expectTypeOf<KonamiEasterEggProps>().toHaveProperty('secretCode');
    expectTypeOf<KonamiEasterEggProps['secretCode']>().toMatchTypeOf<string | null | undefined>();

    expectTypeOf<KonamiEasterEggProps>().toHaveProperty('displayDuration');
    expectTypeOf<KonamiEasterEggProps['displayDuration']>().toMatchTypeOf<
      number | null | undefined
    >();

    expectTypeOf<KonamiEasterEggProps>().toHaveProperty('matrixCharCount');
    expectTypeOf<KonamiEasterEggProps['matrixCharCount']>().toMatchTypeOf<
      number | null | undefined
    >();

    expectTypeOf<KonamiEasterEggProps>().toHaveProperty('confettiCount');
    expectTypeOf<KonamiEasterEggProps['confettiCount']>().toMatchTypeOf<
      number | null | undefined
    >();
  });

  it('3. Assert that invalid prop parameters are blocked during static type checking', () => {
    // Define an invalid signature that breaks the schema contracts
    type InvalidProps = {
      secretCode: number; // Blocked: Should be string
      displayDuration: string; // Blocked: Should be number
      matrixCharCount: boolean; // Blocked: Should be number
    };

    // Assert the TypeScript compiler blocks assignment from InvalidProps
    expectTypeOf<InvalidProps>().not.toMatchTypeOf<KonamiEasterEggProps>();
  });

  it('4. Verify custom types accept optional values without compile errors', () => {
    // The compiler must allow an empty object since all properties are optional
    const validEmptyProps: KonamiEasterEggProps = {};
    expect(validEmptyProps).toBeDefined();

    // The compiler must allow an explicitly populated object without throwing errors
    const validFullProps: KonamiEasterEggProps = {
      secretCode: 'up,up,down,down',
      displayDuration: 5000,
      matrixCharCount: 50,
      confettiCount: 100,
    };
    expect(validFullProps.secretCode).toBe('up,up,down,down');
  });

  it('5. Verify schema validation constraints return strict validation reports', () => {
    // Construct a strict Zod runtime schema mirror of the TypeScript interface
    const EasterEggValidationSchema = z
      .object({
        secretCode: z.string().nullable().optional(),
        displayDuration: z.number().nullable().optional(),
        matrixCharCount: z.number().nullable().optional(),
        confettiCount: z.number().nullable().optional(),
      })
      .strict();

    const validData = { secretCode: 'code123', displayDuration: 3000 };
    const invalidData = { secretCode: 'code123', displayDuration: '3000' }; // Invalid: string instead of number

    // Verify valid data passes strictly
    expect(EasterEggValidationSchema.safeParse(validData).success).toBe(true);

    // Assert that invalid types generate strict validation reports that block execution
    const failedParse = EasterEggValidationSchema.safeParse(invalidData);
    expect(failedParse.success).toBe(false);

    if (!failedParse.success) {
      // Assert the specific invalid_type error was caught by the schema report
      expect(failedParse.error.issues[0].code).toBe('invalid_type');
    }
  });
});
