import { describe, it, expect } from 'vitest';
import { generateRadarSVG } from './radar';
import type { BadgeParams, StreakStats, ContributionCalendar } from '@/types';

const baseParams = {
  user: 'octocat',
  bg: '0d1117',
  text: 'c9d1d9',
  accent: '58a6ff',
} as BadgeParams;
const baseStats: StreakStats = {
  currentStreak: 1,
  longestStreak: 1,
  totalContributions: 1,
} as StreakStats;
const emptyCalendar: ContributionCalendar = { totalContributions: 0, weeks: [] };

describe('[Bug fix] radar Night Owl metric uses real hour data when available', () => {
  it('an all-nighttime commit distribution produces a Night Owl value near 1', () => {
    const hourCounts = new Array(24).fill(0);
    // All 100 commits at 1am
    hourCounts[1] = 100;
    // Shouldn't throw and should render successfully with real hour data
    expect(() => generateRadarSVG(baseStats, baseParams, emptyCalendar, hourCounts)).not.toThrow();
  });

  it('an all-daytime commit distribution produces a Night Owl value near 0', () => {
    const hourCounts = new Array(24).fill(0);
    // All 100 commits at 2pm (14:00) — not in the 9pm-4am night window
    hourCounts[14] = 100;
    expect(() => generateRadarSVG(baseStats, baseParams, emptyCalendar, hourCounts)).not.toThrow();
  });

  it('falls back to the day-of-week proxy without throwing when hourCounts is omitted', () => {
    expect(() => generateRadarSVG(baseStats, baseParams, emptyCalendar)).not.toThrow();
  });

  it('falls back to the day-of-week proxy without throwing when hourCounts fetch failed (undefined)', () => {
    expect(() => generateRadarSVG(baseStats, baseParams, emptyCalendar, undefined)).not.toThrow();
  });
});
