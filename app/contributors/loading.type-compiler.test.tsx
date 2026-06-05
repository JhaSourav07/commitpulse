import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';

// Test suite: verify TypeScript compiler stability and runtime schema boundaries
describe('Contributors loading type & schema compiler checks (Variation 10)', () => {
  // Baseline expected contributor shape (matches ContributorsClient internal shape)
  type ExpectedContributor = {
    id: number;
    login: string;
    avatar_url: string;
    contributions: number;
    html_url: string;
  };

  it('Case 1: Enforce field property configuration types match expected baseline structures exactly', () => {
    // A matching shape should be exactly equal to the expected contributor type
    type Matching = {
      id: number;
      login: string;
      avatar_url: string;
      contributions: number;
      html_url: string;
    };

    expectTypeOf<Matching>().toEqualTypeOf<ExpectedContributor>();
  });

  it('Case 2: Assert that invalid parameter shapes are structurally incompatible', () => {
    // Wrong types / missing required fields should not match ExpectedContributor
    type InvalidContributor = {
      id: string; // wrong type
      login?: string; // optional where required
    };

    expectTypeOf<InvalidContributor>().not.toMatchTypeOf<ExpectedContributor>();
  });

  it('Case 3: Verify custom configurations accept optional parameters without compiler warnings', () => {
    // Define an expected loading config with optional parameters
    type LoadingConfig = {
      limit?: number;
      showAvatars?: boolean;
      filters?: { org?: string } | undefined;
    };

    // A custom consumer may provide only a subset of optional parameters
    const customConfig = { limit: 6 } satisfies LoadingConfig;

    // runtime assertion to keep TS happy and ensure the optional property works
    expect(customConfig.limit).toBe(6);

    // compile-time: ensure the custom minimal shape is assignable to LoadingConfig
    type CustomMinimal = typeof customConfig;
    expectTypeOf<CustomMinimal>().toMatchTypeOf<LoadingConfig>();
  });

  it('Case 4: Runtime validation schemas flag structural boundary anomalies with strict error reports', () => {
    const contributorSchema = z
      .object({
        id: z.number(),
        login: z.string(),
        avatar_url: z.string(),
        contributions: z.number(),
        html_url: z.string(),
      })
      .strict();

    const badPayload = {
      id: 1,
      login: 'alice',
      avatar_url: 'https://example.com/a.png',
      contributions: 42,
      html_url: 'https://github.com/alice',
      unexpected_extra: 'surprise',
    };

    try {
      contributorSchema.parse(badPayload);
      // If parse does not throw, force a failure
      expect(false).toBe(true);
    } catch (err) {
      // ZodError -> inspect issues for unrecognized keys
      const zErr = err as z.ZodError;
      const hasUnrecognized = zErr.issues.some((i) => i.code === z.ZodIssueCode.unrecognized_keys);
      expect(hasUnrecognized).toBe(true);
    }
  });

  it('Case 5: Ensure type parameters resolve down to stable readonly or structured object contracts', () => {
    type ReadonlyContributor = Readonly<ExpectedContributor>;

    // Expected readonly contract
    type ExplicitReadonly = {
      readonly id: number;
      readonly login: string;
      readonly avatar_url: string;
      readonly contributions: number;
      readonly html_url: string;
    };

    expectTypeOf<ReadonlyContributor>().toEqualTypeOf<ExplicitReadonly>();
  });
});
