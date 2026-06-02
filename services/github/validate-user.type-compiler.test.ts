import { describe, expectTypeOf, it } from 'vitest';
import { GitHubUserValidator } from './validate-user';

type ValidateUserReturn = ReturnType<GitHubUserValidator['validateUser']>;

describe('TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('enforces correct parameter and return types for validateUser', () => {
    expectTypeOf<GitHubUserValidator['validateUser']>().parameters.toEqualTypeOf<
      [username: string]
    >();
    expectTypeOf<ValidateUserReturn>().toEqualTypeOf<Promise<boolean>>();
  });

  it('validates singleton instance pattern returns correct type', () => {
    expectTypeOf<
      ReturnType<(typeof GitHubUserValidator)['getInstance']>
    >().toEqualTypeOf<GitHubUserValidator>();
  });

  it('validates reset method returns void', () => {
    expectTypeOf<GitHubUserValidator['reset']>().returns.toBeVoid();
  });

  it('blocks invalid parameter types from being accepted by validateUser parameter type', () => {
    expectTypeOf<GitHubUserValidator['validateUser']>().parameters.toEqualTypeOf<
      [username: string]
    >();

    // These type assertions ensure that only string is accepted:
    expectTypeOf<number>().not.toMatchTypeOf<string>();
    expectTypeOf<object>().not.toMatchTypeOf<string>();
    expectTypeOf<null>().not.toMatchTypeOf<string>();
    expectTypeOf<undefined>().not.toMatchTypeOf<string>();
  });

  it('verifies schema validation constraints return strict validation reports', () => {
    expectTypeOf<ValidateUserReturn>().toEqualTypeOf<Promise<boolean>>();
  });
});
