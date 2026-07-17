import { describe, it, expect } from 'vitest';
import {
  calculateTeamMetrics,
  calculateSprintProgress,
  calculateBurnoutRisk,
  aggregateTeamData,
} from './teamHealth';
import type { TeamMember } from '@/types/enterprise';
import type { ContributionCalendar } from '@/types';

// Because calculateTeamHealthScore is private, these tests exercise it
// indirectly through the metrics it depends on. That still confirms no
// NaN/Infinity leaks into TeamMetrics itself and directly tests the
// already-exported functions with the same division-by-zero shape.

describe('[Bug fix] teamHealth.ts — divide-by-zero guards', () => {
  const emptyMembers: TeamMember[] = [];

  it('calculateTeamMetrics on an empty team returns 0s, not NaN', () => {
    const metrics = calculateTeamMetrics(emptyMembers);
    expect(metrics.totalMembers).toBe(0);
    expect(metrics.activeMembers).toBe(0);
    expect(metrics.combinedContributions).toBe(0);
    expect(Number.isNaN(metrics.averageDailyContributions)).toBe(false);
  });

  it('calculateSprintProgress returns progressPercentage 0 (not NaN) when every member has 0 contributions', () => {
    const zeroContributionMembers: TeamMember[] = [
      {
        username: 'newbie1',
        avatarUrl: '',
        currentStreak: 0,
        longestStreak: 0,
        totalContributions: 0,
        lastContributionDate: new Date().toISOString().split('T')[0],
      },
      {
        username: 'newbie2',
        avatarUrl: '',
        currentStreak: 0,
        longestStreak: 0,
        totalContributions: 0,
        lastContributionDate: new Date().toISOString().split('T')[0],
      },
    ];

    const progress = calculateSprintProgress(zeroContributionMembers);
    expect(Number.isNaN(progress.progressPercentage)).toBe(false);
    expect(progress.progressPercentage).toBe(0);
    expect(progress.targetContributions).toBe(0);
  });

  it('calculateBurnoutRisk on an empty team does not throw and returns a defined score', () => {
    const risk = calculateBurnoutRisk(emptyMembers);
    expect(Number.isNaN(risk.score)).toBe(false);
    expect(typeof risk.level).toBe('string');
  });
});

describe('[Bug fix] aggregateTeamData — end-to-end NaN guard for empty team', () => {
  it('produces finite health score fields for a team with zero members', () => {
    const emptyCalendar: ContributionCalendar = { totalContributions: 0, weeks: [] };
    const data = aggregateTeamData('team-1', 'Empty Team', [], emptyCalendar);

    expect(Number.isFinite(data.healthScore.overall)).toBe(true);
    expect(Number.isFinite(data.healthScore.productivity)).toBe(true);
    expect(Number.isFinite(data.healthScore.collaboration)).toBe(true);
    expect(Number.isFinite(data.sprintProgress[0].progressPercentage)).toBe(true);
  });
});
