import { describe, it, expect } from 'vitest';
import {
  isGhostCity,
  computeTowers,
  computeFaceOpacity,
  computeTowerHeight,
  projectIsometric,
} from './layout';
import type { ContributionCalendar } from '../../types';
import {
  GHOST_HEIGHT_PX,
  LOG_SCALE_MULTIPLIER,
  LINEAR_SCALE_MULTIPLIER,
  MAX_LOG_HEIGHT,
  MAX_LINEAR_HEIGHT,
  MAX_SQRT_HEIGHT,
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
    expect(towers[0].h).toBe(GHOST_HEIGHT_PX);
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
      expect(tower.h).toBe(GHOST_HEIGHT_PX);
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
    expect(towers[0].h).toBe(0);
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

    // Math.log2(3 + 1) * LOG_SCALE_MULTIPLIER = 2 * LOG_SCALE_MULTIPLIER
    const expectedHeight = 2 * LOG_SCALE_MULTIPLIER;
    expect(towers[0].h).toBe(expectedHeight);
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

    const towers = computeTowers(calendar, 'linear', todayDate, 'loc');
    const testTower = towers[0];

    expect(testTower.contributionCount).toBe(60);
    expect(testTower.h).toBeGreaterThan(0);
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
});

// ── computeFaceOpacity tests ──────────────────────────────────────────────────
describe('computeFaceOpacity', () => {
  it('returns fully transparent sides and ghost top for ghost city mode', () => {
    const result = computeFaceOpacity(0, true);
    expect(result.left).toBe(0);
    expect(result.right).toBe(0);
    expect(result.top).toBe(0.08);
  });

  it('ghost city mode returns same opacity regardless of count value', () => {
    const resultZero = computeFaceOpacity(0, true);
    const resultFive = computeFaceOpacity(5, true);
    expect(resultZero).toEqual(resultFive);
  });

  it('returns fully transparent sides and ghost top for count===0 in active calendar', () => {
    const result = computeFaceOpacity(0, false);
    expect(result.left).toBe(0);
    expect(result.right).toBe(0);
    expect(result.top).toBe(0.08);
  });

  it('count===0 non-ghost and ghost mode produce identical FaceOpacity', () => {
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

  it('computes square root scale height correctly', () => {
    // formula: h_scaled = MAX_SQRT_HEIGHT * sqrt(commits / maxCommits)
    // with count=4, maxCommits=16, height should be 50 * sqrt(4/16) = 50 * 0.5 = 25
    expect(computeTowerHeight(4, 'sqrt', false, 16)).toBe(25);
  });

  it('caps square root scale height at maximum', () => {
    expect(computeTowerHeight(20, 'sqrt', false, 10)).toBe(50);
  });

  it('handles empty maxCommits fallback correctly', () => {
    // fallback divisor is count
    // count=4, maxCommits=undefined -> divisor=4 -> sqrt(4/4)*50 = 50
    expect(computeTowerHeight(4, 'sqrt', false)).toBe(50);
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

// ── NEW: Issue 28 — projectIsometric regression tests ────────────────────────
describe('projectIsometric — uses shared layoutConstants grid values', () => {
  it('uses GRID_ORIGIN_X=300 as x origin', () => {
    const result = projectIsometric(5, 5);
    expect(result.x).toBe(300);
  });

  it('uses GRID_ORIGIN_Y=120 as y origin', () => {
    const result = projectIsometric(0, 0);
    expect(result.y).toBe(120);
  });

  it('uses TILE_WIDTH_HALF=16 for x step', () => {
    const r0 = projectIsometric(0, 0);
    const r1 = projectIsometric(1, 0);
    expect(r1.x - r0.x).toBe(16);
  });

  it('uses TILE_HEIGHT_HALF=10 for y step — not 9', () => {
    const r0 = projectIsometric(0, 0);
    const r1 = projectIsometric(1, 0);
    expect(r1.y - r0.y).toBe(10);
    expect(r1.y - r0.y).not.toBe(9);
  });

  it('x decreases as dayIndex increases (isometric left-lean)', () => {
    const r0 = projectIsometric(0, 0);
    const r1 = projectIsometric(0, 1);
    expect(r1.x).toBeLessThan(r0.x);
    expect(r0.x - r1.x).toBe(16);
  });

  it('y increases as both weekIndex and dayIndex increase', () => {
    const r0 = projectIsometric(0, 0);
    const r1 = projectIsometric(1, 1);
    expect(r1.y - r0.y).toBe(20);
  });

  it('grid coordinates are consistent with TILE_HEIGHT_HALF=10 across 14 columns', () => {
    const col0 = projectIsometric(0, 0);
    const col14 = projectIsometric(14, 0);
    expect(col14.y - col0.y).toBe(140);
    expect(col14.y - col0.y).not.toBe(126);
  });
});
