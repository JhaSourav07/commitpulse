import { describe, it, expect } from 'vitest';
import { isLocDay } from './index';
import type { ContributionDay } from './index';

describe('types/index - Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  it('isLocDay returns false for a standard ContributionDay without LoC fields', () => {
    const day: ContributionDay = { contributionCount: 5, date: '2025-06-01' };
    expect(isLocDay(day)).toBe(false);
  });

  it('isLocDay returns true when both locAdditions and locDeletions are present as numbers', () => {
    const day: ContributionDay = {
      contributionCount: 5,
      date: '2025-06-01',
      locAdditions: 150,
      locDeletions: 30,
    };
    expect(isLocDay(day)).toBe(true);
  });

  it('isLocDay returns false when locAdditions is undefined even if locDeletions is a number', () => {
    const day: ContributionDay = {
      contributionCount: 5,
      date: '2025-06-01',
      locDeletions: 30,
    };
    expect(isLocDay(day)).toBe(false);
  });

  it('isLocDay returns false when locDeletions is undefined even if locAdditions is a number', () => {
    const day: ContributionDay = {
      contributionCount: 5,
      date: '2025-06-01',
      locAdditions: 150,
    };
    expect(isLocDay(day)).toBe(false);
  });

  it('isLocDay returns true when loc fields are zero — zero is a valid number', () => {
    const day: ContributionDay = {
      contributionCount: 0,
      date: '2025-06-01',
      locAdditions: 0,
      locDeletions: 0,
    };
    expect(isLocDay(day)).toBe(true);
  });
});
