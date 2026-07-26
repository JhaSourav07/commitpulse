import { describe, expect, expectTypeOf, it } from 'vitest';
import GithubWrapped from './GithubWrapped';
import type { WrappedStats, UserProfile } from '@/types/dashboard';

describe('GithubWrapped type compiler validation', () => {
  const profile: UserProfile = {
    username: 'anvidev',
    name: 'Anvi Gupta',
    avatarUrl: 'https://example.com/avatar.png',
    isPro: false,
    bio: 'Open source contributor',
    location: 'India',
    joinedDate: '2024-01-01',
    developerScore: 85,
    stats: {
      repositories: 20,
      followers: 10,
      following: 5,
      stars: 100,
    },
  };

  const wrappedData: WrappedStats = {
    totalContributions: 1200,
    mostActiveDate: '2026-06-04',
    highestDailyCount: 42,
    busiestMonth: '2026-06',
    weekendRatio: 30,
    topLanguage: 'TypeScript',
    calendar: {
      totalContributions: 1200,
      weeks: [],
    },
  };

  it('accepts valid GithubWrapped props', () => {
    expectTypeOf({
      profile,
      wrappedData,
    }).toMatchTypeOf<{
      profile: UserProfile;
      wrappedData: WrappedStats;
    }>();
  });

  it('enforces UserProfile field types', () => {
    expectTypeOf(profile.username).toBeString();
    expectTypeOf(profile.name).toBeString();
    expectTypeOf(profile.avatarUrl).toBeString();
    expectTypeOf(profile.isPro).toBeBoolean();
    expectTypeOf(profile.bio).toBeString();
    expectTypeOf(profile.location).toBeString();
    expectTypeOf(profile.joinedDate).toBeString();
    expectTypeOf(profile.developerScore).toBeNumber();
  });

  it('enforces nested stats field types', () => {
    expectTypeOf(profile.stats.repositories).toBeNumber();
    expectTypeOf(profile.stats.followers).toBeNumber();
    expectTypeOf(profile.stats.following).toBeNumber();
    expectTypeOf(profile.stats.stars).toBeNumber();
  });

  it('enforces WrappedStats field types', () => {
    expectTypeOf(wrappedData.totalContributions).toBeNumber();
    expectTypeOf(wrappedData.highestDailyCount).toBeNumber();
    expectTypeOf(wrappedData.weekendRatio).toBeNumber();
    expectTypeOf(wrappedData.topLanguage).toBeString();
    expectTypeOf(wrappedData.mostActiveDate).toBeString();
    expectTypeOf(wrappedData.busiestMonth).toBeString();
    expectTypeOf(wrappedData.calendar).toBeObject();
  });

  it('exposes GithubWrapped as a callable React component', () => {
    expect(GithubWrapped).toBeTypeOf('function');

    expectTypeOf(GithubWrapped).parameter(0).toMatchTypeOf<{
      profile: UserProfile;
      wrappedData: WrappedStats;
    }>();
  });
});
