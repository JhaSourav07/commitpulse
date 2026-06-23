import { describe, it, expect } from 'vitest';
import { calculateContributionImpact } from './ImpactScoreEngine';
import { DashboardData } from '@/types/dashboard';

describe('ImpactScoreEngine', () => {
  const mockData: DashboardData = {
    profile: {
      username: 'test-user',
      name: 'Test Contributor',
      avatarUrl: 'https://avatar.url',
      isPro: false,
      bio: 'Developer bio',
      location: 'Earth',
      joinedDate: '2024-01-01',
      developerScore: 80,
      stats: {
        repositories: 10,
        followers: 20,
        following: 15,
        stars: 30,
      },
    },
    stats: {
      currentStreak: 5,
      peakStreak: 10,
      totalContributions: 150,
    },
    languages: [],
    activity: [
      { date: '2026-06-01', count: 10, intensity: 2 },
      { date: '2026-06-02', count: 5, intensity: 1 },
    ],
    insights: [],
    achievements: [],
    commitClock: [],
    graphData: { nodes: [], links: [] },
  };

  it('correctly calculates contribution impact grade and breakdowns', () => {
    const result = calculateContributionImpact(mockData);

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.grade).toBeDefined();
    expect(result.breakdown.codeFootprint).toBeDefined();
    expect(result.breakdown.issueResolution).toBeDefined();
    expect(result.breakdown.collaboration).toBeDefined();
    expect(result.breakdown.communityInfluence).toBeDefined();
  });
});
