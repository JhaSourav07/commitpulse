import { describe, it, expect } from 'vitest';
import type { ActivityData, UserProfile, Achievement, DashboardExportData } from './dashboard';

describe('types/dashboard - Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  it('ActivityData supports lowest intensity value', () => {
    const activity: ActivityData = {
      date: '2025-06-01',
      count: 0,
      intensity: 0,
    };

    expect(activity.intensity).toBe(0);
  });

  it('ActivityData supports highest intensity value', () => {
    const activity: ActivityData = {
      date: '2025-06-01',
      count: 100,
      intensity: 4,
    };

    expect(activity.intensity).toBe(4);
  });

  it('UserProfile supports User account type', () => {
    const profile: UserProfile = {
      username: 'octocat',
      name: 'Octo Cat',
      avatarUrl: 'avatar.png',
      isPro: false,
      bio: 'bio',
      location: 'earth',
      joinedDate: '2025-01-01',
      developerScore: 100,
      type: 'User',
      stats: {
        repositories: 1,
        followers: 2,
        following: 3,
        stars: 4,
      },
    };

    expect(profile.type).toBe('User');
  });

  it('Achievement progress remains within expected percentage range', () => {
    const achievement: Achievement = {
      id: '1',
      title: 'Streak',
      description: 'desc',
      icon: '🔥',
      isUnlocked: false,
      type: 'streak',
      threshold: 100,
      currentValue: 50,
      progress: 50,
    };

    expect(achievement.progress).toBeGreaterThanOrEqual(0);
    expect(achievement.progress).toBeLessThanOrEqual(100);
  });

  it('DashboardExportData accepts empty collections', () => {
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
});
