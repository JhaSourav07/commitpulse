import { describe, it, expect } from 'vitest';
import { computeTowers, computeFaceOpacity, computeTowerHeight } from './layout';
import type { ContributionCalendar } from '../../types';
import {
  GHOST_HEIGHT_PX,
  LOG_SCALE_MULTIPLIER,
  LINEAR_SCALE_MULTIPLIER,
  MAX_LOG_HEIGHT,
  MAX_LINEAR_HEIGHT,
} from './layoutConstants';

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

  it('adds TODAY prefix for today tower without commits', () => {
    const calendar = {
      totalContributions: 0,
      weeks: [{ contributionDays: [{ contributionCount: 0, date: '2024-06-12' }] }],
    } as unknown as ContributionCalendar;
    const towers = computeTowers(calendar, 'linear', '2024-06-12');
    expect(towers[0].tooltip).toContain('TODAY:');
    expect(towers[0].isToday).toBe(true);
    expect(towers[0].isTodayWithCommits).toBe(false);
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
    expect(towers[0].h).toBe(GHOST_HEIGHT_PX); // GHOST_HEIGHT_PX
    expect(towers[0].strokeOpacity).toBe(0.3);
    expect(towers[0].strokeWidth).toBe(0.5);
    expect(towers[0].faceOpacity.top).toBe(0.08);
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
      expect(tower.h).toBe(GHOST_HEIGHT_PX); // GHOST_HEIGHT_PX
      expect(tower.faceOpacity.top).toBe(0.08);
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
    expect(towers.every((tower) => tower.isGhost === false)).toBe(true);
    expect(towers[0].isGhost).toBe(false);
    expect(towers[0].h).toBe(0); // 0 count non-ghost = 0 height
    expect(towers[0].strokeOpacity).toBe(0);
    expect(towers[0].strokeWidth).toBe(0);
    expect(towers[0].faceOpacity.top).toBe(0.08);
    expect(towers[1].isGhost).toBe(false);
    expect(towers[1].h).toBeGreaterThan(0);
    expect(towers[1].faceOpacity.top).toBe(0.7);
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

  // =========================================================================
  // ISSUE OBJECTIVE: LoC Mode Tests
  // =========================================================================
  it('calculates tower height based on LoC additions and deletions in "loc" mode', () => {
    const todayDate = '2026-05-29';
    const calendar = {
      totalContributions: 0,
      weeks: [
        {
          contributionDays: [
            {
              date: todayDate,
              contributionCount: 0,
              locAdditions: 50,
              locDeletions: 10,
            },
          ],
        },
      ],
    } as unknown as ContributionCalendar;

    // Call computeTowers with 'loc' mode parameter
    const towers = computeTowers(calendar, 'linear', todayDate, 'loc');
    const testTower = towers[0];

    // Assert the computed count is 60 (50 + 10)
    expect(testTower.contributionCount).toBe(60);
    // Assert h > 0 (not ghost despite 0 normal contributions)
    expect(testTower.h).toBeGreaterThan(0);
    // Assert intensityLevel is calculated correctly based on lines of code (60/60 = 100%, so intensity 4)
    expect(testTower.intensityLevel).toBe(4);
  });
});

it('assigns correct row and col values based on week/day position', () => {
  const calendar = {
    totalContributions: 0,
    weeks: [
      {
        contributionDays: [
          { contributionCount: 1, date: '2024-06-10' },
          { contributionCount: 1, date: '2024-06-11' },
          { contributionCount: 1, date: '2024-06-12' },
        ],
      },
      {
        contributionDays: [
          { contributionCount: 1, date: '2024-06-13' },
          { contributionCount: 1, date: '2024-06-14' },
          { contributionCount: 1, date: '2024-06-15' },
        ],
      },
    ],
  } as unknown as ContributionCalendar;

  const towers = computeTowers(calendar, 'linear', '2024-06-15');

  expect(towers[0].row).toBe(0);
  expect(towers[0].col).toBe(0);

  expect(towers[1].row).toBe(0);
  expect(towers[1].col).toBe(1);

  expect(towers[3].row).toBe(1);
  expect(towers[3].col).toBe(0);
});

describe('computeFaceOpacity', () => {
  it('returns ghost opacity in ghost city mode', () => {
    expect(computeFaceOpacity(10, true)).toEqual({
      left: 0,
      right: 0,
      top: 0.08,
    });
  });

  it('returns ghost opacity for zero contributions', () => {
    expect(computeFaceOpacity(0, false)).toEqual({
      left: 0,
      right: 0,
      top: 0.08,
    });
  });

  it('returns active opacity for low contribution count', () => {
    expect(computeFaceOpacity(1, false)).toEqual({
      left: 0.35,
      right: 0.21,
      top: 0.7,
    });
  });

  it('returns active opacity for high contribution count', () => {
    expect(computeFaceOpacity(999, false)).toEqual({
      left: 0.35,
      right: 0.21,
      top: 0.7,
    });
  });
});

describe('computeTowerHeight', () => {
  it('returns ghost height when ghost city mode is enabled', () => {
    expect(computeTowerHeight(0, 'linear', true)).toBe(GHOST_HEIGHT_PX);
  });

  it('returns zero height when count is zero and ghost city mode is disabled', () => {
    expect(computeTowerHeight(0, 'linear', false)).toBe(0);
  });

  it('computes linear scale height correctly', () => {
    const expected = Math.min(5 * LINEAR_SCALE_MULTIPLIER, MAX_LINEAR_HEIGHT);

    expect(computeTowerHeight(5, 'linear', false)).toBe(expected);
  });

  it('caps linear scale height at maximum', () => {
    expect(computeTowerHeight(9999, 'linear', false)).toBe(MAX_LINEAR_HEIGHT);
  });

  it('computes logarithmic scale height correctly', () => {
    const expected = Math.min(Math.log2(8 + 1) * LOG_SCALE_MULTIPLIER, MAX_LOG_HEIGHT);

    expect(computeTowerHeight(8, 'log', false)).toBeCloseTo(expected);
  });

  it('caps logarithmic scale height at maximum', () => {
    expect(computeTowerHeight(999999, 'log', false)).toBe(MAX_LOG_HEIGHT);
  });
});
