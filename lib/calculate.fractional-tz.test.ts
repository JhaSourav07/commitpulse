import { describe, it, expect } from 'vitest';
import { calculateStreak } from './calculate';
import type { ContributionCalendar } from '../types';

describe('calculateStreak — fractional timezone alignments (Issue #5257)', () => {
  it('maps contributions pushed at 23:45 IST to the correct local calendar day in Asia/Kolkata', () => {
    const calendar: ContributionCalendar = {
      totalContributions: 1,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 0, date: '2026-06-10' },
            { contributionCount: 1, date: '2026-06-11' },
            { contributionCount: 0, date: '2026-06-12' },
          ],
        },
      ],
    };

    // 23:45 IST on June 11th, 2026 is 18:15 UTC on June 11th, 2026
    const pushedTimeUtc = new Date('2026-06-11T18:15:00.000Z');

    const result = calculateStreak(calendar, 'Asia/Kolkata', pushedTimeUtc);

    expect(result.todayDate).toBe('2026-06-11');
    expect(result.currentStreak).toBe(1);
  });

  it('maps contributions pushed at 23:45 NST to the correct local calendar day in Asia/Kathmandu', () => {
    const calendar: ContributionCalendar = {
      totalContributions: 1,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 0, date: '2026-06-10' },
            { contributionCount: 1, date: '2026-06-11' },
            { contributionCount: 0, date: '2026-06-12' },
          ],
        },
      ],
    };

    // 23:45 NST (Nepal Standard Time, UTC+5:45) on June 11th, 2026 is 18:00 UTC on June 11th, 2026
    const pushedTimeUtc = new Date('2026-06-11T18:00:00.000Z');

    const result = calculateStreak(calendar, 'Asia/Kathmandu', pushedTimeUtc);

    expect(result.todayDate).toBe('2026-06-11');
    expect(result.currentStreak).toBe(1);
  });
});
