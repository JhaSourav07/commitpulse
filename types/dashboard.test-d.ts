import { expectTypeOf } from 'vitest';
import type {
  Achievement,
  ActivityData,
  CommitClockData,
  ContributionCalendar,
  DashboardExportData,
  OrgDashboardData,
  UserProfile,
  UserStats,
} from './dashboard';
import type { ContributionCalendar as ContributionCalendarIndex } from './index';

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

  it('verifies ContributionCalendar is correctly nested and matches the shared index type', () => {
    expectTypeOf<ContributionCalendar>().toMatchTypeOf<ContributionCalendarIndex>();
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
    const exportData: DashboardExportData = {
      stats: {
        currentStreak: 4,
        peakStreak: 12,
        totalContributions: 278,
      },
      languages: [
        {
          name: 'TypeScript',
          color: '#3178c6',
          percentage: 84,
        },
      ],
      activity: [
        {
          date: '2026-06-01',
          count: 15,
          intensity: 3,
          locAdditions: 120,
          locDeletions: 18,
        },
      ],
    };

    expectTypeOf(exportData).toEqualTypeOf<DashboardExportData>();
    expectTypeOf<Achievement['progress']>().toEqualTypeOf<number>();
    expectTypeOf<CommitClockData['commits']>().toEqualTypeOf<number>();
  });

  it('rejects invalid field types for UserProfile at compile time', () => {
    // @ts-expect-error username must be a string and stats must be numbers
    const invalidUser: UserProfile = {
      username: 123,
      name: 'Example User',
      avatarUrl: 'https://example.com/avatar.png',
      isPro: true,
      bio: 'Broken profile',
      location: 'Mars',
      joinedDate: '2024-01-01',
      developerScore: 55,
      stats: {
        repositories: 'not-a-number',
        followers: 'not-a-number',
        following: 'not-a-number',
        stars: 'not-a-number',
      },
    };

    expectTypeOf(invalidUser).toEqualTypeOf<UserProfile>();
  });
});
