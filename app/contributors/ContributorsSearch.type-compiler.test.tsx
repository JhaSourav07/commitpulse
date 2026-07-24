import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';
import ContributorsSearch from './ContributorsSearch';
import React from 'react';

// Extract the Contributor type from the component's props
type Contributor = NonNullable<
  React.ComponentProps<typeof ContributorsSearch>['contributors']
>[number];

describe('ContributorsSearch type & schema compiler checks (Variation 10)', () => {
  it('Case 1: Validate core property shapes match design boundaries', () => {
    type ExpectedContributor = {
      id: number;
      login: string;
      avatar_url: string;
      contributions: number;
      html_url: string;
    };

    expectTypeOf<Contributor>().toEqualTypeOf<ExpectedContributor>();
  });

  it('Case 2: Ensure invalid parameters are blocked via static assignability', () => {
    type InvalidContributor = {
      id: string; // wrong type
      login?: string; // optional where required
      avatar_url: number; // wrong type
    };

    expectTypeOf<InvalidContributor>().not.toMatchTypeOf<Contributor>();
  });

  it('Case 3: Optional fields accepted safely without compile-time warnings', () => {
    // Props for ContributorsSearch accepts optional contributors
    type SearchProps = React.ComponentProps<typeof ContributorsSearch>;

    const minimalProps: SearchProps = {}; // empty object because contributors is optional

    const partialProps: SearchProps = {
      contributors: [],
    };

    expectTypeOf<typeof minimalProps>().toMatchTypeOf<SearchProps>();
    expectTypeOf<typeof partialProps>().toMatchTypeOf<SearchProps>();
    expect(minimalProps).toEqual({});
    expect(partialProps).toEqual({ contributors: [] });
  });

  it('Case 4: Zod runtime schema flags out-of-bound structural types with strict reports', () => {
    const contributorSchema = z
      .object({
        id: z.number().int().positive(),
        login: z.string().min(1),
        avatar_url: z.string().url(),
        contributions: z.number().int().nonnegative(),
        html_url: z.string().url(),
      })
      .strict();

    const badPayload = {
      id: -5,
      login: '',
      avatar_url: 'not-a-url',
      contributions: -1,
      html_url: 'not-a-url',
      extra_field: 'unexpected',
    };

    try {
      contributorSchema.parse(badPayload);
      expect(false).toBe(true);
    } catch (err) {
      const zErr = err as z.ZodError;
      expect(zErr.issues.length).toBeGreaterThan(0);

      // Ensure it caught strictness error (unrecognized_keys)
      const hasUnrecognized = zErr.issues.some((i) => i.code === z.ZodIssueCode.unrecognized_keys);
      expect(hasUnrecognized).toBe(true);
    }
  });

  it('Case 5: Correct payloads safely clear validation limits', () => {
    const contributorSchema = z.object({
      id: z.number().int().positive(),
      login: z.string().min(1),
      avatar_url: z.string().url(),
      contributions: z.number().int().nonnegative(),
      html_url: z.string().url(),
    });

    const goodPayload = {
      id: 123,
      login: 'test-user',
      avatar_url: 'https://example.com/avatar.png',
      contributions: 10,
      html_url: 'https://github.com/test-user',
    };

    const parsed = contributorSchema.parse(goodPayload);
    expect(parsed).toEqual(goodPayload);
    expectTypeOf<typeof parsed>().toMatchTypeOf<Contributor>();
  });
});
