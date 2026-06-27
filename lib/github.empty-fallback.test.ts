import { describe, it, expect } from 'vitest';
import {
  aggregateLanguages,
  buildActivityMap,
  buildInsights,
  buildProfileData,
  computeDeveloperScore,
} from './github';

describe('GitHub Empty Fallback Verification', () => {
  it('renders safe fallback profile values when optional fields are missing', () => {
    const profile = buildProfileData(
      {
        login: 'octocat',
        name: null,
        avatar_url: '',
        public_repos: 0,
        followers: 0,
        following: 0,
        created_at: '2024-01-01T00:00:00Z',
        bio: null,
        location: null,
        plan: null,
      },
      0,
      0
    );

    expect(profile.name).toBe('octocat');
    expect(profile.bio).toBe('No bio available');
    expect(profile.location).toBe('Earth');
    expect(profile.isPro).toBe(false);
  });

  it('returns empty language collection when repo list is empty', () => {
    const result = aggregateLanguages([]);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('returns safe insight cards when language data is missing', () => {
    const insights = buildInsights(
      {
        totalContributions: 0,
        currentStreak: 0,
        longestStreak: 0,
      },
      []
    );

    expect(insights).toHaveLength(3);
    expect(insights[1].text).toContain('Unknown');
  });

  it('returns empty activity map when contribution days are missing', () => {
    const result = buildActivityMap([]);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('returns zero developer score for completely empty activity metrics', () => {
    const score = computeDeveloperScore({
      repos: 0,
      followers: 0,
      stars: 0,
      contributions: 0,
      longestStreak: 0,
    });

    expect(score).toBe(0);
  });
});
