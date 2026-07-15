import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ComponentProps } from 'react';
import TopMetricsRow from './TopMetricsRow';
import type { PRInsightData } from '@/services/github/pr-insights';
import { validateGitHubUsername } from '@/lib/validations';

type TopMetricsRowProps = ComponentProps<typeof TopMetricsRow>;

describe('TopMetricsRow TypeScript Compiler Validation', () => {
  // 1. Use type-testing assertions (expectTypeOf) to enforce field property configurations.
  it('enforces field property configurations of PRInsightData', () => {
    expectTypeOf<PRInsightData['totalPRs']>().toEqualTypeOf<number>();
    expectTypeOf<PRInsightData['mergeRate']>().toEqualTypeOf<number>();
    expectTypeOf<PRInsightData['avgCycleTime']>().toEqualTypeOf<number>();
    expectTypeOf<PRInsightData['avgTimeToFirstReview']>().toEqualTypeOf<number>();
    expectTypeOf<PRInsightData['weeklyActivity']>().toEqualTypeOf<
      { name: string; prs: number }[]
    >();
    expectTypeOf<PRInsightData['prs']>().toEqualTypeOf<
      { title: string; url: string; state: string; createdAt: string; repo: string }[]
    >();
  });

  // 2. Assert that invalid prop parameters are blocked during static type checking.
  it('blocks invalid prop parameters during static type checking', () => {
    expectTypeOf<TopMetricsRowProps>().toBeObject();

    void ({
      // @ts-expect-error totalPRs must be a number
      totalPRs: '120',
      mergeRate: 87.5,
      avgCycleTime: 14.2,
      avgTimeToFirstReview: 3.6,
      weeklyActivity: [],
      prs: [],
      highlights: {},
    } satisfies PRInsightData);

    void ({
      totalPRs: 120,
      mergeRate: 87.5,
      avgCycleTime: 14.2,
      avgTimeToFirstReview: 3.6,
      // @ts-expect-error weeklyActivity must be array of objects
      weeklyActivity: 'none',
      prs: [],
      highlights: {},
    } satisfies PRInsightData);
  });

  // 3. Verify custom types accept optional values without compile errors.
  it('verifies custom highlights object accepts optional values without compile errors', () => {
    const minimalData: PRInsightData = {
      totalPRs: 10,
      openPRs: 2,
      mergedPRs: 6,
      closedPRs: 2,
      mergeRate: 60.0,
      avgReviewTime: 4.0,
      avgTimeToFirstReview: 2.0,
      avgCycleTime: 8.0,
      weeklyActivity: [],
      monthlyActivity: [],
      reviewsGiven: 5,
      reviewsReceived: 5,
      avgReviewResponseTime: 4.0,
      fastestReview: 1.0,
      slowestReview: 10.0,
      repoPerformance: [],
      highlights: {}, // All highlight properties are optional
      prs: [],
    };

    expectTypeOf(minimalData).toMatchTypeOf<PRInsightData>();
  });

  // 4. Verify properties of optional highlights elements
  it('verifies specific types inside the optional highlights structure', () => {
    type MostDiscussed = Exclude<PRInsightData['highlights']['mostDiscussed'], undefined>;
    expectTypeOf<MostDiscussed['comments']>().toEqualTypeOf<number>();
    expectTypeOf<MostDiscussed['title']>().toEqualTypeOf<string>();
    expectTypeOf<MostDiscussed['url']>().toEqualTypeOf<string>();
  });

  // 5. Verify schema validation constraints return strict validation reports.
  it('verifies schema validation constraints and strict type behavior', () => {
    // validateGitHubUsername should strictly accept string and return boolean
    expectTypeOf(validateGitHubUsername).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(validateGitHubUsername).returns.toEqualTypeOf<boolean>();

    expect(validateGitHubUsername('octocat')).toBe(true);
    expect(validateGitHubUsername('invalid username spaces')).toBe(false);
    expect(validateGitHubUsername('')).toBe(false);

    // @ts-expect-error validateGitHubUsername parameter must be string
    void validateGitHubUsername(12345);
  });
});
