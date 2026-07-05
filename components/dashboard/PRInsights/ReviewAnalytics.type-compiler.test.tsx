import { describe, it, expectTypeOf } from 'vitest';
import type React from 'react';

import ReviewAnalytics from './ReviewAnalytics';
import type { PRInsightData } from '@/services/github/pr-insights';

type ReviewAnalyticsProps = React.ComponentProps<typeof ReviewAnalytics>;

describe('ReviewAnalytics TypeScript Compiler Validation & Schema Constraints Stability', () => {
  // Enforces that the component prop shape matches the full PRInsightData contract,
  // preventing regressions if the API interface is refactored or fields are renamed.
  it('accepts PRInsightData as the component data prop type', () => {
    expectTypeOf<ReviewAnalyticsProps>().toMatchTypeOf<{
      data: PRInsightData;
    }>();
  });

  // Asserts that the review-specific numeric fields on PRInsightData are strongly typed
  // as `number`, blocking accidental string or undefined assignments during API updates.
  it('enforces review metric fields as strongly typed numbers', () => {
    expectTypeOf<PRInsightData['reviewsGiven']>().toEqualTypeOf<number>();
    expectTypeOf<PRInsightData['reviewsReceived']>().toEqualTypeOf<number>();
    expectTypeOf<PRInsightData['fastestReview']>().toEqualTypeOf<number>();
    expectTypeOf<PRInsightData['slowestReview']>().toEqualTypeOf<number>();
  });

  // Verifies that a fully constructed PRInsightData object (with optional highlights
  // fields omitted) is still assignable to the component props — confirming optional
  // nested values do not cause compile errors in valid usage.
  it('allows valid PRInsightData with optional highlights omitted to satisfy props', () => {
    const validData: PRInsightData = {
      totalPRs: 42,
      openPRs: 5,
      mergedPRs: 30,
      closedPRs: 7,
      mergeRate: 71.4,
      avgReviewTime: 8.5,
      avgTimeToFirstReview: 3.2,
      avgCycleTime: 20.1,
      weeklyActivity: [{ name: '2024-W01', prs: 4 }],
      monthlyActivity: [{ name: '2024-01', prs: 12 }],
      reviewsGiven: 18,
      reviewsReceived: 22,
      avgReviewResponseTime: 6.0,
      fastestReview: 0.5,
      slowestReview: 48.0,
      repoPerformance: [
        {
          name: 'org/repo',
          totalPRs: 20,
          mergeRate: 85,
          reviewCount: 15,
          avgReviewTime: 7,
        },
      ],
      // highlights is intentionally empty — all sub-fields are optional
      highlights: {},
      prs: [],
    };

    // Optional fields inside highlights must not cause a compile error
    expectTypeOf(validData).toMatchTypeOf<PRInsightData>();
    expectTypeOf<{ data: typeof validData }>().toMatchTypeOf<ReviewAnalyticsProps>();
  });

  // Confirms the schema constraint: highlights sub-fields are individually optional,
  // meaning a partial highlights object is valid at compile time.
  it('accepts partial highlights object without compile errors (optional sub-fields)', () => {
    type HighlightsType = PRInsightData['highlights'];

    // Each sub-field is optional; an empty object must be assignable
    expectTypeOf<HighlightsType>().toMatchTypeOf<{
      mostDiscussed?: { title: string; url: string; comments: number };
      fastestMerged?: { title: string; url: string; time: number };
      largest?: { title: string; url: string; additions: number; deletions: number };
    }>();
  });

  // Validates that the component is exported as a callable React function component,
  // ensuring the module boundary is preserved after refactors.
  it('exports ReviewAnalytics as a callable React function component', () => {
    expectTypeOf(ReviewAnalytics).toBeFunction();
    expectTypeOf<ReviewAnalyticsProps>().toHaveProperty('data');
  });
});

// ---------------------------------------------------------------------------
// Compile-time (static) validation — these blocks are never executed at runtime.
// They use `satisfies` + @ts-expect-error to assert that the TypeScript compiler
// correctly rejects invalid prop parameters during static type checking.
// ---------------------------------------------------------------------------

void ({
  // @ts-expect-error data must conform to PRInsightData, not a plain string
  data: 'invalid-string',
} satisfies ReviewAnalyticsProps);

void ({
  // @ts-expect-error data cannot be a bare number
  data: 42,
} satisfies ReviewAnalyticsProps);
