// lib/svg/isLocDay.test.ts
// Tests for the isLocDay() type guard exported from types/index.ts
// Verifies correct narrowing behavior for both commits and LoC mode days.

import { describe, it, expect } from 'vitest';
import { isLocDay } from '../../types';
import type { ContributionDay } from '../../types';

describe('isLocDay type guard', () => {
  // ── Returns true ───────────────────────────────────────────────────────────

  it('returns true when both locAdditions and locDeletions are 0', () => {
    const day: ContributionDay = {
      contributionCount: 0,
      date: '2024-06-10',
      locAdditions: 0,
      locDeletions: 0,
    };
    expect(isLocDay(day)).toBe(true);
  });

  it('returns true when both locAdditions and locDeletions are positive numbers', () => {
    const day: ContributionDay = {
      contributionCount: 5,
      date: '2024-06-10',
      locAdditions: 120,
      locDeletions: 45,
    };
    expect(isLocDay(day)).toBe(true);
  });

  it('returns true when locAdditions is 0 and locDeletions is positive', () => {
    const day: ContributionDay = {
      contributionCount: 3,
      date: '2024-06-10',
      locAdditions: 0,
      locDeletions: 50,
    };
    expect(isLocDay(day)).toBe(true);
  });

  // ── Returns false ──────────────────────────────────────────────────────────

  it('returns false when both locAdditions and locDeletions are undefined (commits mode)', () => {
    const day: ContributionDay = {
      contributionCount: 5,
      date: '2024-06-10',
    };
    expect(isLocDay(day)).toBe(false);
  });

  it('returns false when locAdditions is undefined but locDeletions is present', () => {
    const day: ContributionDay = {
      contributionCount: 3,
      date: '2024-06-10',
      locDeletions: 10,
    };
    expect(isLocDay(day)).toBe(false);
  });

  it('returns false when locDeletions is undefined but locAdditions is present', () => {
    const day: ContributionDay = {
      contributionCount: 3,
      date: '2024-06-10',
      locAdditions: 10,
    };
    expect(isLocDay(day)).toBe(false);
  });

  // ── Type narrowing behavior ────────────────────────────────────────────────

  it('after isLocDay guard, locAdditions and locDeletions can be used without || 0', () => {
    const day: ContributionDay = {
      contributionCount: 10,
      date: '2024-06-10',
      locAdditions: 200,
      locDeletions: 80,
    };

    let count = 0;
    if (isLocDay(day)) {
      // TypeScript guarantees these are numbers — no || 0 needed
      count = day.locAdditions + day.locDeletions;
    }
    expect(count).toBe(280);
  });

  it('isLocDay returns false for a plain commits-mode day — count falls back correctly', () => {
    const day: ContributionDay = {
      contributionCount: 7,
      date: '2024-06-10',
    };

    const count = isLocDay(day) ? day.locAdditions + day.locDeletions : day.contributionCount;

    expect(count).toBe(7);
  });

  it('isLocDay returns true for a loc-mode day — loc count used over contributionCount', () => {
    const day: ContributionDay = {
      contributionCount: 2,
      date: '2024-06-10',
      locAdditions: 500,
      locDeletions: 100,
    };

    const count = isLocDay(day) ? day.locAdditions + day.locDeletions : day.contributionCount;

    expect(count).toBe(600);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it('returns false for a day with null locAdditions (not undefined but falsy)', () => {
    // null is not a number — typeof null === 'object', not 'number'
    const day = {
      contributionCount: 0,
      date: '2024-06-10',
      locAdditions: null as unknown as number,
      locDeletions: 0,
    } as ContributionDay;
    expect(isLocDay(day)).toBe(false);
  });

  it('returns true for a day with NaN locAdditions because NaN is still a number', () => {
    const day = {
      contributionCount: 0,
      date: '2024-06-10',
      locAdditions: NaN,
      locDeletions: 0,
    } as ContributionDay;

    expect(isLocDay(day)).toBe(true);
  });
});
