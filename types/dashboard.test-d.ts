import { expectTypeOf, describe, it } from 'vitest';
import type {
  Achievement,
  CommitClockData,
  DashboardExportData,
  OrgDashboardData,
  UserProfile,
  UserStats,
} from './dashboard';
import type { ContributionCalendar } from './index';

describe('dashboard type declarations', () => {
  it('ensures UserProfile exposes required fields with the correct types', () => {
    expectTypeOf<UserProfile>().toHaveProperty('username');
    expectTypeOf<UserProfile>().toHaveProperty('stats');
    expectTypeOf<UserProfile['username']>().toBeString();
    expectTypeOf<UserProfile['stats']>().toMatchTypeOf<{
      repositories: number;
      followers: number;
      following: number;
      stars: number;
    }>();
    expectTypeOf<UserProfile['type']>().toEqualTypeOf<'User' | 'Organization' | undefined>();
  });

  it('verifies ContributionCalendar is correctly nested with contribution days', () => {
    expectTypeOf<
      ContributionCalendar['weeks'][number]['contributionDays'][number]['contributionCount']
    >().toEqualTypeOf<number>();
  });

  it('ensures OrgDashboardData includes UserProfile, UserStats, and ContributionCalendar', () => {
    expectTypeOf<OrgDashboardData['profile']>().toEqualTypeOf<UserProfile>();
    expectTypeOf<OrgDashboardData['stats']>().toEqualTypeOf<UserStats>();
    expectTypeOf<OrgDashboardData['calendar']>().toEqualTypeOf<ContributionCalendar>();
  });

  it('accepts valid DashboardExportData shapes including optional activity data', () => {
    expectTypeOf<DashboardExportData['stats']>().toMatchTypeOf<{
      currentStreak: number;
      peakStreak: number;
      totalContributions: number;
    }>();
    expectTypeOf<Achievement['progress']>().toEqualTypeOf<number>();
    expectTypeOf<CommitClockData['commits']>().toEqualTypeOf<number>();
  });

  it('rejects invalid field types for UserProfile at compile time', () => {
    expectTypeOf<UserProfile['username']>().toEqualTypeOf<string>();
    expectTypeOf<UserProfile['stats']['repositories']>().toEqualTypeOf<number>();
    expectTypeOf<UserProfile['stats']['followers']>().toEqualTypeOf<number>();
    expectTypeOf<UserProfile['stats']['following']>().toEqualTypeOf<number>();
    expectTypeOf<UserProfile['stats']['stars']>().toEqualTypeOf<number>();
  });
});
