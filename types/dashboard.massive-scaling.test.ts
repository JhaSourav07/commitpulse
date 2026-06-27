import { describe, expect, it } from 'vitest';
import type { ActivityData, UserProfile, WrappedStats, Repository } from './dashboard';

describe('types/dashboard — Massive Data Sets and Extreme High Bounds Scaling', () => {
  // Test Case 1: ActivityData array models thousands of contributor entries correctly
  it('correctly models an array of 10,000 ActivityData entries with valid intensity bounds', () => {
    const data: ActivityData[] = Array.from({ length: 10000 }, (_, i) => ({
      date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
      count: i * 3,
      intensity: (i % 5) as ActivityData['intensity'],
      locAdditions: i * 10,
      locDeletions: i * 2,
    }));

    expect(data).toHaveLength(10000);
    expect(data[0].intensity).toBe(0);
    expect(data[4].intensity).toBe(4);
    expect(data[9999].count).toBe(29997);
  });

  // Test Case 2: UserProfile satisfies type constraints under extreme numeric stat values
  it('accepts UserProfile with extreme high stat values at integer boundaries', () => {
    const profile: UserProfile = {
      username: 'extreme-user',
      name: 'Extreme User',
      avatarUrl: 'https://example.com/avatar.png',
      isPro: true,
      bio: 'Bio',
      location: 'Earth',
      joinedDate: '2008-04-01',
      developerScore: 100,
      stats: {
        repositories: Number.MAX_SAFE_INTEGER,
        followers: Number.MAX_SAFE_INTEGER,
        following: Number.MAX_SAFE_INTEGER,
        stars: Number.MAX_SAFE_INTEGER,
      },
    };

    expect(profile.stats.repositories).toBe(Number.MAX_SAFE_INTEGER);
    expect(profile.stats.followers).toBe(Number.MAX_SAFE_INTEGER);
    expect(profile.developerScore).toBe(100);
    expect(profile.isPro).toBe(true);
  });

  // Test Case 3: ActivityData intensity union only accepts values 0–4 at both bounds
  it('validates ActivityData intensity at minimum (0) and maximum (4) boundary values', () => {
    const minActivity: ActivityData = { date: '2024-01-01', count: 0, intensity: 0 };
    const maxActivity: ActivityData = { date: '2024-12-31', count: 999999999, intensity: 4 };

    expect(minActivity.intensity).toBe(0);
    expect(minActivity.count).toBe(0);
    expect(maxActivity.intensity).toBe(4);
    expect(maxActivity.count).toBe(999999999);
  });

  // Test Case 4: Repository array models large listings with nullable primaryLanguage
  it('correctly models 2,000 Repository entries including null primaryLanguage entries', () => {
    const repositories: Repository[] = Array.from({ length: 2000 }, (_, i) => ({
      name: `repo-${i}`,
      description: i % 2 === 0 ? `Description for repo ${i}` : null,
      stargazerCount: i * 100,
      forkCount: i * 10,
      url: `https://github.com/user/repo-${i}`,
      primaryLanguage: i % 3 === 0 ? null : { name: 'TypeScript', color: '#3178c6' },
    }));

    const nullLangRepos = repositories.filter((r) => r.primaryLanguage === null);
    const nullDescRepos = repositories.filter((r) => r.description === null);

    expect(repositories).toHaveLength(2000);
    expect(repositories[0].primaryLanguage).toBeNull();
    expect(nullLangRepos.length).toBeGreaterThan(0);
    expect(nullDescRepos.length).toBeGreaterThan(0);
  });

  // Test Case 5: WrappedStats models extreme contribution totals and boundary weekendRatio
  it('accepts WrappedStats at weekendRatio extremes (0 and 100) with max totalContributions', () => {
    const zeroRatio: WrappedStats = {
      calendar: { totalContributions: 999999999, weeks: [] },
      totalContributions: 999999999,
      topLanguage: 'TypeScript',
      highestDailyCount: 9999,
      mostActiveDate: '2024-06-15',
      busiestMonth: '2024-06',
      weekendRatio: 0,
    };

    const fullRatio: WrappedStats = {
      ...zeroRatio,
      weekendRatio: 100,
    };

    expect(zeroRatio.totalContributions).toBe(999999999);
    expect(zeroRatio.weekendRatio).toBe(0);
    expect(fullRatio.weekendRatio).toBe(100);
    expect(fullRatio.calendar.totalContributions).toBe(999999999);
  });
});
