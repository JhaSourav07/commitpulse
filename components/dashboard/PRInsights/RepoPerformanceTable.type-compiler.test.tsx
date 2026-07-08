import { describe, it, expectTypeOf } from 'vitest';
import type React from 'react';

import RepoPerformanceTable from './RepoPerformanceTable';
import type { PRInsightData } from '@/services/github/pr-insights';

type RepoPerformanceTableProps = React.ComponentProps<typeof RepoPerformanceTable>;
type RepoPerformanceEntry = PRInsightData['repoPerformance'][number];

describe('RepoPerformanceTable TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('accepts PRInsightData as the component data prop type', () => {
    expectTypeOf<RepoPerformanceTableProps>().toMatchTypeOf<{
      data: PRInsightData;
    }>();
  });

  it('enforces the repoPerformance entry schema fields', () => {
    expectTypeOf<RepoPerformanceEntry>().toMatchTypeOf<{
      name: string;
      totalPRs: number;
      mergeRate: number;
      reviewCount: number;
      avgReviewTime: number;
    }>();
  });

  it('keeps repository metric fields strongly typed as numbers', () => {
    expectTypeOf<RepoPerformanceEntry['totalPRs']>().toEqualTypeOf<number>();
    expectTypeOf<RepoPerformanceEntry['mergeRate']>().toEqualTypeOf<number>();
    expectTypeOf<RepoPerformanceEntry['reviewCount']>().toEqualTypeOf<number>();
    expectTypeOf<RepoPerformanceEntry['avgReviewTime']>().toEqualTypeOf<number>();
  });

  it('keeps repository names strongly typed as strings', () => {
    expectTypeOf<RepoPerformanceEntry['name']>().toEqualTypeOf<string>();
  });

  it('allows valid PRInsightData objects to be assigned to component props', () => {
    const validData: PRInsightData = {
      totalPRs: 100,
      openPRs: 10,
      mergedPRs: 80,
      closedPRs: 10,
      mergeRate: 80,
      avgReviewTime: 12,
      avgTimeToFirstReview: 4,
      avgCycleTime: 24,

      weeklyActivity: [{ name: 'Week 1', prs: 20 }],
      monthlyActivity: [{ name: 'January', prs: 100 }],

      reviewsGiven: 50,
      reviewsReceived: 40,
      avgReviewResponseTime: 6,
      fastestReview: 1,
      slowestReview: 72,

      repoPerformance: [
        {
          name: 'commitpulse/core',
          totalPRs: 50,
          mergeRate: 90,
          reviewCount: 25,
          avgReviewTime: 8,
        },
      ],

      highlights: {},
      prs: [],
    };

    expectTypeOf(validData).toMatchTypeOf<PRInsightData>();
    expectTypeOf<{ data: typeof validData }>().toMatchTypeOf<RepoPerformanceTableProps>();
  });
});
