import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';
import ContributorsClient from './ContributorsClient';
import React from 'react';

// Extract Contributor type from component props
type Contributor = React.ComponentProps<typeof ContributorsClient>['contributors'][number];

type ContributorsClientProps = React.ComponentProps<typeof ContributorsClient>;

describe('ContributorsClient type & schema compiler checks (Variation 10)', () => {
  it('Case 1: Validate contributor property types', () => {
    type ExpectedContributor = {
      id: number;
      login: string;
      avatar_url: string;
      contributions: number;
      html_url: string;
    };

    expectTypeOf<Contributor>().toEqualTypeOf<ExpectedContributor>();
  });

  it('Case 2: Invalid contributor structures should fail assignability', () => {
    type InvalidContributor = {
      id: string;
      login?: string;
      avatar_url: number;
      contributions: string;
      html_url: boolean;
    };

    expectTypeOf<InvalidContributor>().not.toMatchTypeOf<Contributor>();
  });

  it('Case 3: Component props accept valid optional collections', () => {
    const props: ContributorsClientProps = {
      contributors: [],
      topContributors: [],
      totalContributions: 0,
    };

    expectTypeOf<typeof props>().toMatchTypeOf<ContributorsClientProps>();
    expect(props.totalContributions).toBe(0);
  });

  it('Case 4: Runtime schema rejects malformed contributor payloads', () => {
    const contributorSchema = z
      .object({
        id: z.number().int().positive(),
        login: z.string().min(1),
        avatar_url: z.string().url(),
        contributions: z.number().int().nonnegative(),
        html_url: z.string().url(),
      })
      .strict();

    const invalidPayload = {
      id: -1,
      login: '',
      avatar_url: 'bad-url',
      contributions: -5,
      html_url: 'bad-url',
      extra: true,
    };

    expect(() => contributorSchema.parse(invalidPayload)).toThrow();
  });

  it('Case 5: Runtime schema accepts valid contributor payloads', () => {
    const contributorSchema = z.object({
      id: z.number().int().positive(),
      login: z.string().min(1),
      avatar_url: z.string().url(),
      contributions: z.number().int().nonnegative(),
      html_url: z.string().url(),
    });

    const validPayload = {
      id: 1,
      login: 'deepsikha',
      avatar_url: 'https://example.com/avatar.png',
      contributions: 25,
      html_url: 'https://github.com/deepsikha',
    };

    const parsed = contributorSchema.parse(validPayload);

    expect(parsed).toEqual(validPayload);
    expectTypeOf<typeof parsed>().toMatchTypeOf<Contributor>();
  });
});
