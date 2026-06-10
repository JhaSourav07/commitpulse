import { describe, expectTypeOf, it } from 'vitest';

import type {
  ActivityData,
  CompareResponse,
  CompareUserData,
  LanguageData,
  UserProfile,
  UserStats,
} from './CompareClient';

describe('CompareClient Type Compiler Validation', () => {
  it('validates UserProfile structure', () => {
    expectTypeOf<UserProfile>().toEqualTypeOf<{
      username: string;
      name: string;
      avatarUrl: string;
      isPro: boolean;
      bio: string;
      location: string;
      joinedDate: string;
      developerScore: number;
      stats: {
        repositories: number;
        followers: number;
        following: number;
        stars: number;
      };
    }>();
  });

  it('validates UserStats numeric and optional fields', () => {
    expectTypeOf<UserStats>().toEqualTypeOf<{
      currentStreak: number;
      peakStreak: number;
      totalContributions: number;
      codingHabit?: string;
      totalPRs?: number;
      totalIssues?: number;
    }>();
  });

  it('validates LanguageData structure', () => {
    expectTypeOf<LanguageData>().toEqualTypeOf<{
      name: string;
      color: string;
      percentage: number;
    }>();
  });

  it('accepts optional fields in ActivityData without compile errors', () => {
    expectTypeOf<ActivityData>().toEqualTypeOf<{
      date: string;
      count: number;
      intensity: 0 | 1 | 2 | 3 | 4;
      locAdditions?: number;
      locDeletions?: number;
    }>();
  });

  it('validates CompareResponse structure', () => {
    expectTypeOf<CompareResponse>().toEqualTypeOf<{
      user1: CompareUserData;
      user2: CompareUserData;
      error?: string;
    }>();
  });
});
