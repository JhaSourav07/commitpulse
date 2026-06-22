/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { isLocDay } from './index';
import type {
  ContributionDay,
  StreakStats,
  BadgeTheme,
  MonthlyStats,
  NotificationPreferences,
} from './index';

describe('types/index - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('1. isLocDay returns false when locAdditions and locDeletions are undefined', () => {
    const day: ContributionDay = { contributionCount: 5, date: '2025-01-15' };
    expect(isLocDay(day)).toBe(false);
  });

  it('2. isLocDay returns false when locAdditions or locDeletions is missing, and true when both are present', () => {
    expect(isLocDay({ contributionCount: 5, date: '2025-01-15' })).toBe(false);
    expect(isLocDay({ contributionCount: 5, date: '2025-01-15', locAdditions: 10 } as any)).toBe(
      false
    );
    expect(isLocDay({ contributionCount: 5, date: '2025-01-15', locDeletions: 3 } as any)).toBe(
      false
    );
    expect(
      isLocDay({ contributionCount: 5, date: '2025-01-15', locAdditions: 10, locDeletions: 3 })
    ).toBe(true);
  });

  it('3. isLocDay handles null and non-number locAdditions/locDeletions without crashing', () => {
    expect(
      isLocDay({
        contributionCount: 5,
        date: '2025-01-15',
        locAdditions: null as any,
        locDeletions: null as any,
      })
    ).toBe(false);
    expect(
      isLocDay({
        contributionCount: 5,
        date: '2025-01-15',
        locAdditions: '10' as any,
        locDeletions: '3' as any,
      })
    ).toBe(false);
    expect(
      isLocDay({ contributionCount: 5, date: '2025-01-15', locAdditions: 0, locDeletions: 0 })
    ).toBe(true);
  });

  it('4. constructs empty StreakStats and BadgeTheme with default-like zero values', () => {
    const streak: StreakStats = {
      currentStreak: 0,
      longestStreak: 0,
      totalContributions: 0,
      todayDate: '',
    };
    expect(streak.currentStreak).toBe(0);
    expect(streak.longestStreak).toBe(0);

    const theme: BadgeTheme = {
      bg: '000000' as any,
      text: 'ffffff' as any,
      accent: '58a6ff' as any,
    };
    expect(theme.negative).toBeUndefined();
  });

  it('5. constructs MonthlyStats with null deltaPercentage for undefined baseline', () => {
    const stats: MonthlyStats = {
      currentMonthTotal: 0,
      previousMonthTotal: 0,
      deltaPercentage: null,
      deltaAbsolute: 0,
      currentMonthName: '',
    };
    expect(stats.deltaPercentage).toBeNull();
    expect(stats.deltaAbsolute).toBe(0);
  });

  it('6. constructs NotificationPreferences in default disabled state', () => {
    const prefs: NotificationPreferences = {
      enabled: false,
      frequency: 'daily',
      email: '',
      notifyOnCommit: false,
      notifyOnStreak: false,
      notifyOnMilestone: false,
    };
    expect(prefs.enabled).toBe(false);
    expect(prefs.email).toBe('');
    expect(prefs.notifyOnCommit).toBe(false);
  });
});
