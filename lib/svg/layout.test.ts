import { describe, it, expect } from 'vitest';
import { computeTowers } from './layout';
import type { ContributionCalendar } from '../../types';

describe('computeTowers edge cases', () => {
  it('adds TODAY prefix for today tower with commits', () => {
    const calendar = {
      totalContributions: 0,
      weeks: [{ contributionDays: [{ contributionCount: 5, date: '2024-06-12' }] }],
    } as unknown as ContributionCalendar;
    const towers = computeTowers(calendar, 'linear', '2024-06-12');
    expect(towers[0].tooltip).toContain('TODAY:');
    expect(towers[0].isTodayWithCommits).toBe(true);
  });

  it('does not add TODAY prefix for non-today tower', () => {
    const calendar = {
      totalContributions: 0,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 5, date: '2024-06-10' },
            { contributionCount: 2, date: '2024-06-12' },
          ],
        },
      ],
    } as unknown as ContributionCalendar;
    const towers = computeTowers(calendar, 'linear', '2024-06-12');
    expect(towers[0].tooltip).not.toContain('TODAY:');
    expect(towers[0].isToday).toBe(false);
  });

  it('handles empty weeks array correctly', () => {
    const calendar = { totalContributions: 0, weeks: [] } as unknown as ContributionCalendar;
    const towers = computeTowers(calendar, 'linear', '2024-06-12');
    expect(towers.length).toBe(0);
  });

  it('slices to exactly 14 weeks if more than 14 weeks are provided', () => {
    const weeks = Array(20)
      .fill(0)
      .map((_, i) => ({ contributionDays: [{ contributionCount: 1, date: `2024-01-${i + 1}` }] }));
    const calendar = { totalContributions: 0, weeks } as unknown as ContributionCalendar;
    const towers = computeTowers(calendar, 'linear', '2024-01-20');
    expect(towers.length).toBe(14);
  });

  it('processes exactly 14 weeks without slicing out elements', () => {
    const weeks = Array(14)
      .fill(0)
      .map((_, i) => ({ contributionDays: [{ contributionCount: 1, date: `2024-01-${i + 1}` }] }));
    const calendar = { totalContributions: 0, weeks } as unknown as ContributionCalendar;
    const towers = computeTowers(calendar, 'linear', '2024-01-14');
    expect(towers.length).toBe(14);
  });

  it('marks last visible day as today when todayDate is outside the window (fallback)', () => {
    const calendar = {
      totalContributions: 0,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 0, date: '2024-06-10' },
            { contributionCount: 0, date: '2024-06-11' },
          ],
        },
      ],
    } as unknown as ContributionCalendar;
    const towers = computeTowers(calendar, 'linear', '2024-12-31');
    const lastTower = towers[towers.length - 1];

    expect(towers).toHaveLength(2);
    expect(towers[0].isToday).toBe(false);
    expect(lastTower.isToday).toBe(true);
  });

  it('correctly assigns isToday when todayDate is in window', () => {
    const calendar = {
      totalContributions: 0,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 0, date: '2024-06-10' },
            { contributionCount: 0, date: '2024-06-11' },
          ],
        },
      ],
    } as unknown as ContributionCalendar;
    const towers = computeTowers(calendar, 'linear', '2024-06-10');
    expect(towers[0].isToday).toBe(true);
    expect(towers[1].isToday).toBe(false);
  });

  it('enables ghost city mode when total visible contributions is 0', () => {
    const calendar = {
      totalContributions: 0,
      weeks: [{ contributionDays: [{ contributionCount: 0, date: '2024-06-10' }] }],
    } as unknown as ContributionCalendar;
    const towers = computeTowers(calendar, 'linear', '2024-06-10');
    expect(towers[0].isGhost).toBe(true);
    expect(towers[0].h).toBe(4); // GHOST_HEIGHT_PX
    expect(towers[0].strokeOpacity).toBe(0.3);
    expect(towers[0].strokeWidth).toBe(0.5);
  });

  it('marks every tower as a ghost with ghost height for an all-zero calendar', () => {
    const calendar = {
      totalContributions: 0,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 0, date: '2024-06-10' },
            { contributionCount: 0, date: '2024-06-11' },
          ],
        },
        {
          contributionDays: [
            { contributionCount: 0, date: '2024-06-12' },
            { contributionCount: 0, date: '2024-06-13' },
          ],
        },
      ],
    } as unknown as ContributionCalendar;
    const towers = computeTowers(calendar, 'linear', '2024-06-13');

    towers.forEach((tower) => {
      expect(tower.isGhost).toBe(true);
      expect(tower.h).toBe(4); // GHOST_HEIGHT_PX
    });
  });

  it('disables ghost city mode when total visible contributions > 0', () => {
    const calendar = {
      totalContributions: 0,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 0, date: '2024-06-10' },
            { contributionCount: 1, date: '2024-06-11' },
          ],
        },
      ],
    } as unknown as ContributionCalendar;
    const towers = computeTowers(calendar, 'linear', '2024-06-10');
    expect(towers[0].isGhost).toBe(false);
    expect(towers[0].h).toBe(0); // 0 count non-ghost = 0 height
    expect(towers[0].strokeOpacity).toBe(0);
    expect(towers[0].strokeWidth).toBe(0);
    expect(towers[1].isGhost).toBe(false);
    expect(towers[1].h).toBeGreaterThan(0);
  });

  it('uses logarithmic scale heights', () => {
    const calendar = {
      totalContributions: 0,
      weeks: [{ contributionDays: [{ contributionCount: 3, date: '2024-06-10' }] }],
    } as unknown as ContributionCalendar;
    const towers = computeTowers(calendar, 'log', '2024-06-10');
    // Math.log2(3 + 1) * 12 = 2 * 12 = 24
    expect(towers[0].h).toBe(24);
  });
});
