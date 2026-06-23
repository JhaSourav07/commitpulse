import { describe, expect, it } from 'vitest';
import type {
  UserProfile,
  ActivityData,
  UserStats,
  DashboardExportData,
  WrappedStats,
} from './dashboard';

describe('types/dashboard - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('constructs UserProfile with empty strings and omitted optional type safely', () => {
    const profile: UserProfile = {
      username: '',
      name: '',
      avatarUrl: '',
      isPro: false,
      bio: '',
      location: '',
      joinedDate: '',
      developerScore: 0,
      stats: {
        repositories: 0,
        followers: 0,
        following: 0,
        stars: 0,
      },
    };

    expect(profile.username).toBe('');
    expect(profile.type).toBeUndefined();
    expect(profile.stats.repositories).toBe(0);
  });

  it('constructs ActivityData with minimum valid values and missing LoC fields', () => {
    const activity: ActivityData = {
      date: '',
      count: 0,
      intensity: 0,
    };

    expect(activity.date).toBe('');
    expect(activity.locAdditions).toBeUndefined();
    expect(activity.locDeletions).toBeUndefined();
  });

  it('constructs UserStats with zero-value metrics without runtime issues', () => {
    const stats: UserStats = {
      currentStreak: 0,
      peakStreak: 0,
      totalContributions: 0,
    };

    expect(stats.currentStreak).toBe(0);
    expect(stats.peakStreak).toBe(0);
    expect(stats.totalContributions).toBe(0);
  });

  it('constructs DashboardExportData with empty arrays safely', () => {
    const exportData: DashboardExportData = {
      stats: {
        currentStreak: 0,
        peakStreak: 0,
        totalContributions: 0,
      },
      languages: [],
      activity: [],
    };

    expect(exportData.languages).toHaveLength(0);
    expect(exportData.activity).toHaveLength(0);
  });

  it('constructs WrappedStats with empty calendar weeks and default-like values', () => {
    const wrapped: WrappedStats = {
      totalContributions: 0,
      mostActiveDate: '',
      highestDailyCount: 0,
      busiestMonth: '',
      weekendRatio: 0,
      topLanguage: '',
      calendar: {
        totalContributions: 0,
        weeks: [],
      },
    };

    expect(wrapped.calendar.weeks).toHaveLength(0);
    expect(wrapped.totalContributions).toBe(0);
    expect(wrapped.topLanguage).toBe('');
  });
});
