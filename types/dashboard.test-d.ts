import { describe, expectTypeOf, it } from 'vitest';

import type {
  UserProfile,
  ActivityData,
  CommitClockData,
  WrappedStats,
  OrgDashboardData,
  Repository,
  UserStats,
} from './dashboard';

import type { ContributionCalendar } from './index';

describe('dashboard type safety', () => {
  it('UserProfile contains required fields', () => {
    expectTypeOf<UserProfile>().toMatchTypeOf<{
      username: string;
      name: string;
      avatarUrl: string;
      isPro: boolean;
      bio: string;
      location: string;
      joinedDate: string;
      developerScore: number;
      type?: 'User' | 'Organization';
      stats: {
        repositories: number;
        followers: number;
        following: number;
        stars: number;
      };
    }>();
  });

  it('ActivityData intensity only accepts valid union values', () => {
    expectTypeOf<ActivityData['intensity']>().toEqualTypeOf<0 | 1 | 2 | 3 | 4>();
  });

  it('CommitClockData is correctly typed', () => {
    expectTypeOf<CommitClockData>().toMatchTypeOf<{
      day: string;
      commits: number;
    }>();
  });

  it('WrappedStats contains calendar and contribution fields', () => {
    expectTypeOf<WrappedStats>().toMatchTypeOf<{
      totalContributions: number;
      mostActiveDate: string;
      highestDailyCount: number;
      busiestMonth: string;
      weekendRatio: number;
      topLanguage: string;
      calendar: ContributionCalendar;
    }>();
  });

  it('OrgDashboardData contains expected fields', () => {
    expectTypeOf<OrgDashboardData>().toMatchTypeOf<{
      profile: UserProfile;
      stats: UserStats;
      calendar: ContributionCalendar;
    }>();
  });

  it('Repository primaryLanguage supports null values', () => {
    expectTypeOf<Repository>().toMatchTypeOf<{
      name: string;
      description: string | null;
      stargazerCount: number;
      forkCount: number;
      url: string;
      primaryLanguage: {
        name: string;
        color: string;
      } | null;
    }>();
  });
});
