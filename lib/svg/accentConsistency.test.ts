import { describe, it, expect } from 'vitest';
import { generateCommitClockSVG } from './commitClock';
import { generateRadarSVG } from './radar';
import { generateWeekdaySVG } from './weekday';
import type { BadgeParams, StreakStats, ContributionCalendar } from '../../types';

const multiAccent = ['ff0000', '00ff00', '0000ff'] as unknown as BadgeParams['accent'];

const baseParams = {
  user: 'octocat',
  bg: '0d1117',
  text: 'c9d1d9',
  accent: multiAccent,
} as unknown as BadgeParams;

const baseStats: StreakStats = {
  currentStreak: 5,
  longestStreak: 10,
  totalContributions: 42,
} as StreakStats;

const emptyCalendar: ContributionCalendar = { totalContributions: 0, weeks: [] };

describe('[Bug fix] multi-color accent array resolves consistently across views', () => {
  it('commitClock uses the LAST color of a multi-color accent array', () => {
    const svg = generateCommitClockSVG(new Array(24).fill(1), baseStats, baseParams);
    expect(svg).toContain('#0000ff');
    expect(svg).not.toContain('#ff0000');
  });

  it('radar uses the LAST color of a multi-color accent array', () => {
    const svg = generateRadarSVG(baseStats, baseParams, emptyCalendar);
    expect(svg).toContain('#0000ff');
    expect(svg).not.toContain('#ff0000');
  });

  it('weekday stays consistent with the last-color convention', () => {
    const svg = generateWeekdaySVG(baseStats, baseParams, emptyCalendar);
    expect(svg).toContain('0000ff');
  });
});
