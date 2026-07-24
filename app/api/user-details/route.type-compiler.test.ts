// app/api/user-details/route.type-compiler.test.ts
// Purpose: Verify TypeScript Compiler Validation & Schema Constraints Stability
// for the user-details API route.

import { describe, expect, it, expectTypeOf } from 'vitest';
import { githubUsernameSchema, GITHUB_USERNAME_REGEX } from '@/lib/validations';

// Define the API contract for the request query parameters and response structure
export type UserDetailsRequestParams = {
  username: string;
};

export type UserDetailsResponseSuccess = {
  exists: true;
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  stats: {
    currentStreak: number;
    longestStreak: number;
    totalContributions: number;
  };
};

export type UserDetailsResponseError = {
  error: string;
};

export type UserDetailsResponse = UserDetailsResponseSuccess | UserDetailsResponseError;

describe('ApiUserDetailsRoute - TypeScript Compiler Validation & Schema Constraints Stability (Variation 10)', () => {
  // Case 1: Import surface & baseline property checks
  it('Case 1: Validate baseline request and response property structures to verify type matching parameters align perfectly', () => {
    // Check that we can import the schema and it has safeParse
    expect(githubUsernameSchema).toBeDefined();
    expect(typeof githubUsernameSchema.safeParse).toBe('function');

    // Assert that UserDetailsRequestParams['username'] is a string
    expectTypeOf<UserDetailsRequestParams['username']>().toEqualTypeOf<string>();

    // Assert UserDetailsResponseSuccess fields
    expectTypeOf<UserDetailsResponseSuccess>().toHaveProperty('exists');
    expectTypeOf<UserDetailsResponseSuccess['exists']>().toEqualTypeOf<true>();
    expectTypeOf<UserDetailsResponseSuccess['login']>().toEqualTypeOf<string>();
    expectTypeOf<UserDetailsResponseSuccess['name']>().toEqualTypeOf<string | null>();
    expectTypeOf<UserDetailsResponseSuccess['avatar_url']>().toEqualTypeOf<string>();
    expectTypeOf<UserDetailsResponseSuccess['public_repos']>().toEqualTypeOf<number>();

    // Assert nested stats structure
    expectTypeOf<UserDetailsResponseSuccess['stats']>().toHaveProperty('currentStreak');
    expectTypeOf<UserDetailsResponseSuccess['stats']['currentStreak']>().toEqualTypeOf<number>();
    expectTypeOf<UserDetailsResponseSuccess['stats']['longestStreak']>().toEqualTypeOf<number>();
    expectTypeOf<
      UserDetailsResponseSuccess['stats']['totalContributions']
    >().toEqualTypeOf<number>();
  });

  // Case 2: Assert that invalid prop parameters are blocked during static type checking
  it('Case 2: Ensure invalid structural definitions are caught and blocked during static assignment checks', () => {
    type InvalidRequestParamsNumber = {
      username: number;
    };

    type InvalidRequestParamsMissing = {
      user: string;
    };

    type InvalidRequestParamsNull = {
      username: string | null;
    };

    expectTypeOf<InvalidRequestParamsNumber>().not.toMatchTypeOf<UserDetailsRequestParams>();
    expectTypeOf<InvalidRequestParamsMissing>().not.toMatchTypeOf<UserDetailsRequestParams>();
    expectTypeOf<InvalidRequestParamsNull>().not.toMatchTypeOf<UserDetailsRequestParams>();
  });

  // Case 3: Verify custom types accept optional values without compile errors
  it('Case 3: Verify that custom response envelopes accept optional or null values (like name) without compile errors', () => {
    type UserDetailsResponseWithOptionalName = {
      exists: true;
      login: string;
      name?: string | null;
      avatar_url: string;
      public_repos: number;
      stats: {
        currentStreak: number;
        longestStreak: number;
        totalContributions: number;
      };
    };

    // UserDetailsResponseSuccess has 'name' as string | null (required).
    // UserDetailsResponseWithOptionalName has 'name' as string | null | undefined (optional).
    // Therefore, any UserDetailsResponseSuccess satisfies UserDetailsResponseWithOptionalName:
    expectTypeOf<UserDetailsResponseSuccess>().toMatchTypeOf<UserDetailsResponseWithOptionalName>();

    // Test a response where name is not defined (optional)
    const validResponseMock: UserDetailsResponseWithOptionalName = {
      exists: true,
      login: 'octocat',
      avatar_url: 'https://github.com/octocat.png',
      public_repos: 10,
      stats: {
        currentStreak: 5,
        longestStreak: 5,
        totalContributions: 100,
      },
    };

    expectTypeOf(validResponseMock).toEqualTypeOf<UserDetailsResponseWithOptionalName>();
  });

  // Case 4: Verify schema validation constraints return strict validation reports on violation
  it('Case 4: Assert that the strict username validation schema rejects out-of-bounds or malformed fields with flat error reports', () => {
    // 1. Empty username
    const emptyResult = githubUsernameSchema.safeParse('');
    expect(emptyResult.success).toBe(false);
    if (!emptyResult.success) {
      expect(emptyResult.error.flatten().formErrors).toContain('Invalid GitHub username');
    }

    // 2. Too long username (> 39 chars)
    const tooLongResult = githubUsernameSchema.safeParse('a'.repeat(40));
    expect(tooLongResult.success).toBe(false);
    if (!tooLongResult.success) {
      expect(tooLongResult.error.flatten().formErrors).toContain('Invalid GitHub username');
    }

    // 3. Username with invalid characters
    const invalidCharResult = githubUsernameSchema.safeParse('invalid_user_name_@');
    expect(invalidCharResult.success).toBe(false);
    if (!invalidCharResult.success) {
      expect(invalidCharResult.error.flatten().formErrors).toContain('Invalid GitHub username');
    }

    // 4. Username starting with a hyphen
    const startHyphenResult = githubUsernameSchema.safeParse('-invalid-start');
    expect(startHyphenResult.success).toBe(false);
  });

  // Case 5: Valid payloads pass parsing gates and preserve type integrity
  it('Case 5: Prove that standard compliant username parameters cleanly clear validation gates and preserve underlying type integrity definitions', () => {
    const validUsername = 'octocat';
    const result = githubUsernameSchema.safeParse(validUsername);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toBe(validUsername);
      expectTypeOf(result.data).toEqualTypeOf<string>();
    }

    // Verify regex validation directly
    expect(GITHUB_USERNAME_REGEX.test('octocat')).toBe(true);
    expect(GITHUB_USERNAME_REGEX.test('octocat-123')).toBe(true);
    expect(GITHUB_USERNAME_REGEX.test('123-octocat')).toBe(true);
  });
});
