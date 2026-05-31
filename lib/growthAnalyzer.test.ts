import { describe, it, expect } from 'vitest';
import { analyzeGrowth } from './growthAnalyzer';

describe('growthAnalyzer', () => {
  const dummyProfile = {
    username: 'testuser',
    name: 'Test User',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1',
    joinedDate: 'Jan 2020',
    developerScore: 50,
    stats: {
      repositories: 10,
      followers: 20,
      following: 15,
      stars: 50,
    },
  };

  const dummyLanguages = [
    { name: 'TypeScript', color: '#3178c6', percentage: 70 },
    { name: 'JavaScript', color: '#f1e05a', percentage: 30 },
  ];

  const dummyCommitClock = [
    { day: 'Sun', commits: 5 },
    { day: 'Mon', commits: 10 },
    { day: 'Tue', commits: 12 },
    { day: 'Wed', commits: 8 },
    { day: 'Thu', commits: 9 },
    { day: 'Fri', commits: 15 },
    { day: 'Sat', commits: 4 },
  ];

  it('should analyze growth correctly with active contribution history', () => {
    // Construct active activity days: 365 days
    const activity = Array.from({ length: 365 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Give contributions on every 4th day
      const hasCommits = i % 4 === 0;
      return {
        date: dateStr,
        count: hasCommits ? 3 : 0,
        intensity: (hasCommits ? 2 : 0) as 0 | 1 | 2 | 3 | 4,
        locAdditions: hasCommits ? 120 : 0,
        locDeletions: hasCommits ? 30 : 0,
      };
    });

    const result = analyzeGrowth({
      profile: dummyProfile,
      stats: {
        currentStreak: 4,
        peakStreak: 12,
        totalContributions: 270,
      },
      languages: dummyLanguages,
      activity,
      commitClock: dummyCommitClock,
    });

    // Verify Growth Score
    expect(result.growthScore).toBeGreaterThan(0);
    expect(result.growthScore).toBeLessThanOrEqual(100);

    // Verify breakdown elements
    expect(result.growthScoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(result.growthScoreBreakdown.consistencyScore).toBeGreaterThan(0);
    expect(result.growthScoreBreakdown.volumeScore).toBeGreaterThan(0);
    expect(result.growthScoreBreakdown.qualityScore).toBeGreaterThan(0);

    // Verify Trend
    expect(result.growthTrend.text).toBeDefined();
    expect(['up', 'down', 'stable']).toContain(result.growthTrend.direction);

    // Verify Consistency Analysis
    expect(result.consistencyAnalysis.activeDaysRatio).toBeGreaterThan(0);
    expect(result.consistencyAnalysis.longestActiveGap).toBe(3); // every 4th day means gap of 3 inactive days
    expect(result.consistencyAnalysis.longestStreak).toBe(12);

    // Verify Productivity Spikes
    expect(result.productivitySpikes.length).toBeGreaterThanOrEqual(1);

    // Verify Skills
    expect(result.skillInsights.primaryLanguage).toBe('TypeScript');
    expect(result.skillInsights.detectedTechs).toContain('TypeScript');
    expect(result.skillInsights.strongestAreas.length).toBeGreaterThan(0);

    // Verify Roadmap
    expect(result.personalizedRoadmap.shortTermGoals.length).toBe(3);
    expect(result.personalizedRoadmap.longTermGoals.length).toBe(3);
    expect(result.personalizedRoadmap.milestones.length).toBe(6);

    // Verify Recommendations
    expect(result.aiRecommendations.difficultyLevel).toBe('Advanced'); // total contributions 270 >= 100
    expect(result.aiRecommendations.categoryRatings.length).toBe(5);
    expect(result.aiRecommendations.improvementSuggestions.length).toBeGreaterThan(0);

    // Verify Monthly summary
    expect(result.monthlyProgressSummaries.length).toBe(6);
  });

  it('should handle zero-activity profile gracefully without crashes', () => {
    const activity = Array.from({ length: 365 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      return {
        date: dateStr,
        count: 0,
        intensity: 0 as const,
      };
    });

    const result = analyzeGrowth({
      profile: {
        ...dummyProfile,
        developerScore: 5,
      },
      stats: {
        currentStreak: 0,
        peakStreak: 0,
        totalContributions: 0,
      },
      languages: [],
      activity,
      commitClock: [],
    });

    expect(result.growthScore).toBe(0);
    expect(result.growthScoreBreakdown.frequencyScore).toBe(0);
    expect(result.growthScoreBreakdown.consistencyScore).toBe(0);
    expect(result.growthScoreBreakdown.volumeScore).toBe(0);
    expect(result.growthScoreBreakdown.qualityScore).toBe(0);
    expect(result.skillInsights.primaryLanguage).toBe('JavaScript');
    expect(result.aiRecommendations.difficultyLevel).toBe('Beginner');
    expect(result.productivitySpikes.length).toBe(0);
  });
});
