import { describe, it, expect } from 'vitest';
import { isGhostCity, computeTowers, computeFaceOpacity, computeTowerHeight } from './layout';
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
  it('ensures all tower heights are non-negative', () => {
    const calendar = {
      totalContributions: 26,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 0, date: '2024-06-10' },
            { contributionCount: 1, date: '2024-06-11' },
            { contributionCount: 5, date: '2024-06-12' },
            { contributionCount: 20, date: '2024-06-13' },
          ],
        },
      ],
    } as unknown as ContributionCalendar;

    const towers = computeTowers(calendar, 'linear', '2024-06-13');

    towers.forEach((tower) => {
      expect(tower.h).toBeGreaterThanOrEqual(0);
    });
  });
});

it('assigns correct row and col values based on week/day position', () => {
  const calendar = {
    totalContributions: 0,
    weeks: [
      {
        contributionDays: [
          { contributionCount: 1, date: '2024-06-09' },
          { contributionCount: 1, date: '2024-06-10' },
          { contributionCount: 1, date: '2024-06-11' },
        ],
      },
      {
        contributionDays: [
          { contributionCount: 1, date: '2024-06-16' },
          { contributionCount: 1, date: '2024-06-17' },
          { contributionCount: 1, date: '2024-06-18' },
        ],
      },
    ],
  } as unknown as ContributionCalendar;

  const towers = computeTowers(calendar, 'linear', '2024-06-18');

  expect(towers[0].row).toBe(0);
  expect(towers[0].col).toBe(0);

  expect(towers[1].row).toBe(0);
  expect(towers[1].col).toBe(1);

  expect(towers[3].row).toBe(1);
  expect(towers[3].col).toBe(0);
});

// ── computeFaceOpacity tests ──────────────────────────────────────────────────
// Previously this function had ZERO test coverage despite being called for
// every tower in the isometric grid. These tests lock in the behavior of all
// three branches and serve as a regression guard for future opacity changes.

describe('computeFaceOpacity', () => {
  it('returns fully transparent sides and ghost top for ghost city mode', () => {
    const result = computeFaceOpacity(0, true);
    expect(result.left).toBe(0);
    expect(result.right).toBe(0);
    expect(result.top).toBe(0.08);
  });

  it('ghost city mode returns same opacity regardless of count value', () => {
    // In ghost city mode, all towers use the same ghost opacity — even if
    // a count value is somehow passed, isGhostCityMode takes priority
    const resultZero = computeFaceOpacity(0, true);
    const resultFive = computeFaceOpacity(5, true);
    expect(resultZero).toEqual(resultFive);
  });

  it('returns fully transparent sides and ghost top for count===0 in active calendar', () => {
    // Empty day in an active calendar — intentionally same as ghost city mode.
    // This is the "dead branch" documented in Issue #(your issue number):
    // both branches return identical values by design.
    const result = computeFaceOpacity(0, false);
    expect(result.left).toBe(0);
    expect(result.right).toBe(0);
    expect(result.top).toBe(0.08);
  });

  it('count===0 non-ghost and ghost mode produce identical FaceOpacity', () => {
    // Documents that the two branches returning the same value is intentional.
    // If this test ever fails, it means the design intent changed and both
    // branches need to be updated consistently.
    const ghost = computeFaceOpacity(0, true);
    const emptyActive = computeFaceOpacity(0, false);
    expect(ghost).toEqual(emptyActive);
  });

  it('returns full active opacity for count > 0 in non-ghost mode', () => {
    const result = computeFaceOpacity(5, false);
    expect(result.left).toBe(0.35);
    expect(result.right).toBe(0.21);
    expect(result.top).toBe(0.7);
  });

  it('active opacity applies regardless of contribution count magnitude', () => {
    const resultOne = computeFaceOpacity(1, false);
    const resultHundred = computeFaceOpacity(100, false);
    expect(resultOne).toEqual(resultHundred);
    expect(resultOne.left).toBe(0.35);
    expect(resultOne.right).toBe(0.21);
    expect(resultOne.top).toBe(0.7);
  });

  it('left face opacity is always 0 for empty or ghost towers', () => {
    expect(computeFaceOpacity(0, true).left).toBe(0);
    expect(computeFaceOpacity(0, false).left).toBe(0);
  });

  it('right face opacity is always 0 for empty or ghost towers', () => {
    expect(computeFaceOpacity(0, true).right).toBe(0);
    expect(computeFaceOpacity(0, false).right).toBe(0);
  });

  it('top face opacity is 0.08 for ghost/empty and 0.7 for active', () => {
    expect(computeFaceOpacity(0, true).top).toBe(0.08);
    expect(computeFaceOpacity(0, false).top).toBe(0.08);
    expect(computeFaceOpacity(1, false).top).toBe(0.7);
  });

  it('active tower has higher opacity than ghost/empty on all faces', () => {
    const active = computeFaceOpacity(10, false);
    const ghost = computeFaceOpacity(0, true);
    expect(active.left).toBeGreaterThan(ghost.left);
    expect(active.right).toBeGreaterThan(ghost.right);
    expect(active.top).toBeGreaterThan(ghost.top);
  });

  it('returns a plain object with exactly left, right, top keys', () => {
    const result = computeFaceOpacity(5, false);
    expect(Object.keys(result).sort()).toEqual(['left', 'right', 'top']);
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

describe('isGhostCity', () => {
  it('should return true if there are zero contributions across all weeks', () => {
    const emptyCalendarWeeks = [
      {
        contributionDays: [
          { contributionCount: 0, locAdditions: 0, locDeletions: 0 },
          { contributionCount: 0, locAdditions: 0, locDeletions: 0 },
        ],
      },
    ];
    expect(isGhostCity(emptyCalendarWeeks)).toBe(true);
  });

  it('should return false if at least one day has standard contributions', () => {
    const activeCalendarWeeks = [
      {
        contributionDays: [
          { contributionCount: 0, locAdditions: 0, locDeletions: 0 },
          { contributionCount: 5, locAdditions: 0, locDeletions: 0 },
        ],
      },
    ];
    expect(isGhostCity(activeCalendarWeeks)).toBe(false);
  });

  it('should return false if at least one day has lines of code (LoC) modifications', () => {
    const locOnlyCalendarWeeks = [
      {
        contributionDays: [
          { contributionCount: 0, locAdditions: 120, locDeletions: 0 },
          { contributionCount: 0, locAdditions: 0, locDeletions: 0 },
        ],
      },
    ];
    expect(isGhostCity(locOnlyCalendarWeeks)).toBe(false);
  });
});
