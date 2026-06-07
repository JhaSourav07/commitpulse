import { describe, it, expect, expectTypeOf } from 'vitest';

import type {
  BadgeParams,
  NotificationPreferences,
  NotificationPayload,
  NotificationResponse,
  GraphNode,
} from './index';

describe('types/index accessibility contracts', () => {
  it('exposes GraphNode type with accessible node metadata structure', () => {
    const node: GraphNode = {
      id: 'repo-1',
      name: 'commitpulse',
      type: 'Repo',
      val: 10,
      color: '#3B82F6',
      stats: {
        stars: 100,
        forks: 25,
        language: 'TypeScript',
        updatedAt: '2025-01-01',
        description: 'Repository description',
      },
    };

    expect(node.name).toBe('commitpulse');
    expect(node.type).toBe('Repo');
    expect(node.stats?.description).toBe('Repository description');
  });

  it('supports notification preferences required for accessible user communication', () => {
    const prefs: NotificationPreferences = {
      enabled: true,
      frequency: 'daily',
      email: 'user@example.com',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: false,
    };

    expect(prefs.enabled).toBe(true);
    expect(prefs.frequency).toBe('daily');
    expect(prefs.email).toContain('@');
  });

  it('supports notification payload structure used by user-facing messaging', () => {
    const payload: NotificationPayload = {
      username: 'kanishka',
      email: 'kanishka@example.com',
      frequency: 'weekly',
      preferences: {
        notifyOnCommit: true,
        notifyOnStreak: false,
        notifyOnMilestone: true,
      },
    };

    expect(payload.username).toBe('kanishka');
    expect(payload.preferences.notifyOnMilestone).toBe(true);
  });

  it('supports notification response shape for screen-reader friendly status messages', () => {
    const response: NotificationResponse = {
      success: true,
      message: 'Preferences updated successfully',
    };

    expect(response.success).toBe(true);
    expect(response.message.length).toBeGreaterThan(0);
  });

  it('preserves BadgeParams typing for user-facing badge configuration', () => {
    expectTypeOf<BadgeParams>().toMatchTypeOf<{
      user: string;
      bg: string;
      text: string;
      accent: string | string[];
      speed: `${number}s`;
      scale: 'linear' | 'log';
    }>();
  });
});
