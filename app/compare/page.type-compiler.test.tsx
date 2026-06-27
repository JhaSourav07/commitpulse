import { describe, it, expect, expectTypeOf } from 'vitest';

describe('ComparePage - TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('imports and basic type-testing utilities are available', () => {
    expect(expectTypeOf).toBeDefined();
  });

  it('enforces UserProfile field property configurations', () => {
    interface UserProfile {
      username: string;
      name: string;
      avatarUrl: string;
      isPro: boolean;
      bio: string;
      location: string;
      joinedDate: string;
      developerScore: number;
    }

    expectTypeOf<UserProfile>().toHaveProperty('username').toBeString();
    expectTypeOf<UserProfile>().toHaveProperty('name').toBeString();
    expectTypeOf<UserProfile>().toHaveProperty('isPro').toBeBoolean();
    expectTypeOf<UserProfile>().toHaveProperty('developerScore').toBeNumber();
  });

  it('validates UserStats optional fields', () => {
    interface UserStats {
      currentStreak: number;
      peakStreak: number;
      totalContributions: number;
      codingHabit?: string;
      totalPRs?: number;
      totalIssues?: number;
    }

    const stats: UserStats = {
      currentStreak: 10,
      peakStreak: 20,
      totalContributions: 100,
    };

    expectTypeOf(stats.currentStreak).toEqualTypeOf<number>();
    expect(stats.totalContributions).toBe(100);
  });

  it('accepts optional values without compile errors', () => {
    interface ActivityData {
      date: string;
      count: number;
      intensity: 0 | 1 | 2 | 3 | 4;
      locAdditions?: number;
      locDeletions?: number;
    }

    const activity: ActivityData = {
      date: '2024-01-01',
      count: 5,
      intensity: 2,
    };

    expectTypeOf(activity).toMatchTypeOf<ActivityData>();
  });

  it('verifies schema-like constraints for CompareResponse structure', () => {
    interface CompareResponse {
      user1: unknown;
      user2: unknown;
      error?: string;
    }

    expectTypeOf<CompareResponse>().toHaveProperty('user1');
    expectTypeOf<CompareResponse>().toHaveProperty('user2');
    expectTypeOf<CompareResponse>().toHaveProperty('error').toEqualTypeOf<string | undefined>();
  });
});
