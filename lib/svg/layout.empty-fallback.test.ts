import { describe, it, expect } from 'vitest';
import type { ContributionCalendar } from '../../types';
import { isGhostCity, computeTowerHeight, computeFaceOpacity, computeTowers } from './layout';
import { GHOST_HEIGHT_PX } from './layoutConstants';

describe('LibSvgLayout Edge Cases & Empty/Missing Inputs Verification', () => {
  it('1. isGhostCity correctly identifies an empty monolith with zero contributions', () => {
    // Empty arrays
    expect(isGhostCity([])).toBe(true);

    // Weeks with no days
    expect(isGhostCity([{ contributionDays: [] }])).toBe(true);

    // Days with zero count and zero LoC
    expect(
      isGhostCity([
        {
          contributionDays: [
            { contributionCount: 0, locAdditions: 0, locDeletions: 0 },
            { contributionCount: 0 },
          ],
        },
      ])
    ).toBe(true);

    // Non-empty calendar
    expect(isGhostCity([{ contributionDays: [{ contributionCount: 1 }] }])).toBe(false);
  });

  it('2. computeTowerHeight handles empty states without scale breakage', () => {
    // When count is 0 and showGhostCity is true, it renders the static blueprint height
    expect(computeTowerHeight(0, 'linear', true)).toBe(GHOST_HEIGHT_PX);

    // When count is 0 and showGhostCity is false, it safely returns 0
    expect(computeTowerHeight(0, 'log', false)).toBe(0);
  });

  it('3. computeFaceOpacity generates transparent blueprints in empty states', () => {
    // When in ghost mode, it returns the empty blueprint opacity regardless of count
    expect(computeFaceOpacity(0, true)).toEqual({ left: 0, right: 0, top: 0.08 });
    expect(computeFaceOpacity(10, true)).toEqual({ left: 0, right: 0, top: 0.08 });

    // When count is 0 but not in ghost mode, it safely returns the empty opacity
    expect(computeFaceOpacity(0, false)).toEqual({ left: 0, right: 0, top: 0.08 });
  });

  it('4. computeTowers safely handles an empty calendar with no weeks', () => {
    // Passing a fully empty calendar object
    const emptyCalendar = {
      totalContributions: 0,
      weeks: [],
    } as unknown as ContributionCalendar;

    const towers = computeTowers(emptyCalendar, 'linear', '2026-06-13', 'commits');
    expect(towers).toEqual([]);
    expect(towers.length).toBe(0);
  });

  it('5. computeTowers properly renders ghost towers for a calendar with completely empty weeks', () => {
    // Calendar with 1 week containing 1 entirely empty day
    const emptyCalendar = {
      totalContributions: 0,
      weeks: [
        {
          contributionDays: [{ date: '2026-06-13', contributionCount: 0 }],
        },
      ],
    } as unknown as ContributionCalendar;

    const towers = computeTowers(emptyCalendar, 'linear', '2026-06-13', 'commits');

    // Asserts clear non-breaking fallback UI data structures
    expect(towers.length).toBe(1);

    const tower = towers[0];
    expect(tower.hasCommits).toBe(false);
    expect(tower.isGhost).toBe(true);
    expect(tower.isToday).toBe(true);
    expect(tower.isTodayWithCommits).toBe(false);
    expect(tower.h).toBe(GHOST_HEIGHT_PX);
    expect(tower.faceOpacity).toEqual({ left: 0, right: 0, top: 0.08 });
    expect(tower.strokeOpacity).toBe(0.3);
    expect(tower.strokeWidth).toBe(0.5);
    expect(tower.intensityLevel).toBe(0);
  });
});
