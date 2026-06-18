import { describe, expect, it } from 'vitest';
import {
  computeDeveloperScore,
  aggregateLanguages,
  buildActivityMap,
  buildCommitClock,
  generateAchievements,
} from './github';
import { ContributionDay } from '@/types';

describe('GitHub Lib — Massive Data Sets & Extreme High Bounds Scaling', () => {
  it('scales computeDeveloperScore smoothly when processing massive value inputs without numerical wrapping', () => {
    const giantInput = {
      repos: 50000,
      followers: 1000000,
      stars: 2500000,
      contributions: 5000000,
      longestStreak: 3650,
    };

    const maximumClampedScore = computeDeveloperScore(giantInput);

    expect(maximumClampedScore).toBe(100);
  });

  it('handles aggregateLanguages flawlessly when scanning through a collection of 50,000 repositories', () => {
    const totalRepos = 50000;
    const languagesPool = ['TypeScript', 'JavaScript', 'Go', 'Rust', 'Python', null];
    const massiveReposList = Array.from({ length: totalRepos }, (_, i) => ({
      language: languagesPool[i % languagesPool.length],
    }));

    const topLanguages = aggregateLanguages(massiveReposList);

    expect(topLanguages.length).toBeLessThanOrEqual(5);

    expect(topLanguages.length).toBeGreaterThan(0);
    expect(topLanguages.every((lang) => lang.percentage > 0)).toBe(true);
    expect(typeof topLanguages[0].name).toBe('string');
  });

  it('processes buildActivityMap cleanly over a 50-year dataset without layout data tree corruption', () => {
    const daysInFiftyYears = 365 * 50 + 12;

    const historicalDays = Array.from({ length: daysInFiftyYears }, (_, i) => {
      const contributionCount = i % 12;
      return {
        date: '2026-06-17',
        contributionCount,
        color: '#edf2f7',
        locAdditions: i,
        locDeletions: i * 2,
      };
    });

    const outputMap = buildActivityMap(historicalDays);

    expect(outputMap).toHaveLength(daysInFiftyYears);

    expect(outputMap[11].intensity).toBe(4);
    expect(outputMap[0].intensity).toBe(0);
    expect(outputMap[2].intensity).toBe(1);
  });

  it('computes buildCommitClock predictably when aggregating massive daily contribution arrays', () => {
    const totalItems = 10000;

    const massiveDays: ContributionDay[] = Array.from({ length: totalItems }, () => ({
      date: '2026-06-17',
      contributionCount: 10,
      color: '#edf2f7',
    }));

    const resultClock = buildCommitClock(massiveDays, 'UTC');

    expect(resultClock).toHaveLength(7);

    const aggregatedCommits = resultClock.reduce((sum, current) => sum + current.commits, 0);
    expect(aggregatedCommits).toBe(totalItems * 10);
  });

  it('evaluates generateAchievements without dropping nodes when input metrics clear all ceiling benchmarks', () => {
    const astronomicalContributions = 10000000;
    const extremeStreak = 50000;
    const extremeWeekendCommits = 250000;
    const extremeLanguagesCount = 85;

    const achievementsList = generateAchievements(
      astronomicalContributions,
      extremeStreak,
      extremeWeekendCommits,
      extremeLanguagesCount
    );

    expect(achievementsList.length).toBeGreaterThan(0);

    const basicContributionMilestone = achievementsList.find((a) => a.id === 'contrib-1');
    const weekendWarrior = achievementsList.find((a) => a.id === 'weekend-warrior');

    expect(basicContributionMilestone?.isUnlocked).toBe(true);
    expect(weekendWarrior?.isUnlocked).toBe(true);
    expect(basicContributionMilestone?.progress).toBe(100);
  });
});
