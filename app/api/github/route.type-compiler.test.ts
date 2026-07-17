import { describe, it, expect, expectTypeOf } from 'vitest';
import { GET } from './route';
import { githubParamsSchema } from '@/lib/validations';
import { z } from 'zod';

describe('API Route /api/github TypeScript Compiler & Schema Constraints', () => {
  it('1. enforces field property configurations on the inferred output type', () => {
    type GithubParams = z.infer<typeof githubParamsSchema>;

    expectTypeOf<GithubParams>().toHaveProperty('username').toBeString();
    expectTypeOf<GithubParams>().toHaveProperty('bg').toBeString();
    expectTypeOf<GithubParams>().toHaveProperty('accent').toBeString();
    expectTypeOf<GithubParams>().toHaveProperty('width').toBeNumber();
    expectTypeOf<GithubParams>().toHaveProperty('height').toBeNumber();
    expectTypeOf<GithubParams>().toHaveProperty('refresh').toBeBoolean();
    expectTypeOf<GithubParams>().toHaveProperty('bypassCache').toBeBoolean();
  });

  it('2. asserts that invalid prop parameters are blocked during static type checking on inputs', () => {
    type GithubParamsInput = z.input<typeof githubParamsSchema>;

    // Ensure non-preprocessed parameters require string or undefined
    expectTypeOf<GithubParamsInput>().toHaveProperty('bg').toEqualTypeOf<string | undefined>();
    expectTypeOf<GithubParamsInput>().toHaveProperty('accent').toEqualTypeOf<string | undefined>();
    expectTypeOf<GithubParamsInput>().toHaveProperty('width').toEqualTypeOf<string | undefined>();
    expectTypeOf<GithubParamsInput>().toHaveProperty('height').toEqualTypeOf<string | undefined>();

    // Zod boolean preprocess accepts any/unknown input by default based on zod's standard preprocess types
    expectTypeOf<GithubParamsInput>().toHaveProperty('refresh').toEqualTypeOf<unknown>();
  });

  it('3. verifies custom types accept optional values without compile errors', () => {
    type GithubParamsInput = z.input<typeof githubParamsSchema>;

    // Providing only the required username
    const validInput: GithubParamsInput = { username: 'linusvalds' };
    expectTypeOf(validInput).toMatchTypeOf<GithubParamsInput>();

    // Providing partial optional values
    const partialInput: GithubParamsInput = { username: 'linusvalds', width: '800' };
    expectTypeOf(partialInput).toMatchTypeOf<GithubParamsInput>();

    // Missing required field causes compile error in assignment
    // @ts-expect-error - username is a required field in input typing
    const missingRequired: GithubParamsInput = { width: '800' };
    expect(missingRequired).toBeDefined();
  });

  it('4. verifies schema validation constraints return strict validation reports for invalid data', () => {
    // Missing username
    const resultMissing = githubParamsSchema.safeParse({});
    expect(resultMissing.success).toBe(false);
    if (!resultMissing.success) {
      expect(resultMissing.error.issues[0].message).toBe('Missing "username" parameter');
    }

    // Empty username
    const resultEmpty = githubParamsSchema.safeParse({ username: '' });
    expect(resultEmpty.success).toBe(false);
    if (!resultEmpty.success) {
      expect(resultEmpty.error.issues[0].message).toBe('Username is required');
    }

    // Too long username
    const resultTooLong = githubParamsSchema.safeParse({ username: 'a'.repeat(40) });
    expect(resultTooLong.success).toBe(false);
    if (!resultTooLong.success) {
      expect(resultTooLong.error.issues[0].message).toBe(
        'GitHub username cannot exceed 39 characters'
      );
    }
  });

  it('5. enforces static typing and signature configuration on the GET route handler', () => {
    // The GET function is an asynchronous handler taking a Request and returning a Response
    expectTypeOf(GET).toBeFunction();
    expectTypeOf(GET).parameters.toMatchTypeOf<[Request] | [Request, unknown]>();
    expectTypeOf(GET).returns.resolves.toMatchTypeOf<Response>();
  });
});
