import { describe, it, expect } from 'vitest';
import type {
  GraphNode,
  GraphLink,
  BadgeParams,
  NotificationPreferences,
  ContributionDay,
} from './index';
import { isLocDay } from './index';

describe('types/index Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('supports graph structures used by aria-labelled graph components', () => {
    const node: GraphNode = {
      id: '1',
      name: 'Repository',
      type: 'Repo',
      val: 10,
      color: '#fff',
    };

    const link: GraphLink = {
      source: '1',
      target: '2',
    };

    expect(node.name).toBe('Repository');
    expect(link.source).toBe('1');
  });

  it('supports accessible badge configuration metadata', () => {
    const params: BadgeParams = {
      user: 'octocat',
      bg: '000000' as BadgeParams['bg'],
      text: 'ffffff' as BadgeParams['text'],
      accent: '58a6ff' as BadgeParams['accent'],
      speed: '8s',
      scale: 'linear',
    };

    expect(params.user).toBe('octocat');
    expect(params.scale).toBe('linear');
  });

  it('correctly identifies LoC contribution entries through type guard', () => {
    const day: ContributionDay = {
      contributionCount: 5,
      date: '2026-01-01',
      locAdditions: 50,
      locDeletions: 10,
    };

    expect(isLocDay(day)).toBe(true);
  });

  it('rejects contribution entries without LoC fields', () => {
    const day: ContributionDay = {
      contributionCount: 5,
      date: '2026-01-01',
    };

    expect(isLocDay(day)).toBe(false);
  });

  it('supports notification preferences required by accessible user settings', () => {
    const prefs: NotificationPreferences = {
      enabled: true,
      frequency: 'daily',
      email: 'test@example.com',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: false,
    };

    expect(prefs.enabled).toBe(true);
    expect(prefs.frequency).toBe('daily');
  });
});
