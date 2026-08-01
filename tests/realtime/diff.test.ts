import { describe, it, expect } from 'vitest';
import { diffContributions } from '@/lib/realtime/diffContributions';
import type { ContributionCalendar } from '@/types';

describe('diffContributions', () => {
  it('should return empty list when old calendar is null', () => {
    const newCal: ContributionCalendar = {
      totalContributions: 5,
      weeks: [
        {
          contributionDays: [{ date: '2026-07-20', contributionCount: 5 }],
        },
      ],
    };
    const result = diffContributions('user1', null, newCal);
    expect(result).toEqual([]);
  });

  it('should detect added contributions', () => {
    const oldCal: ContributionCalendar = {
      totalContributions: 5,
      weeks: [
        {
          contributionDays: [
            { date: '2026-07-20', contributionCount: 5 },
            { date: '2026-07-21', contributionCount: 0 },
          ],
        },
      ],
    };
    const newCal: ContributionCalendar = {
      totalContributions: 8,
      weeks: [
        {
          contributionDays: [
            { date: '2026-07-20', contributionCount: 6 }, // +1
            { date: '2026-07-21', contributionCount: 2 }, // +2
          ],
        },
      ],
    };

    const result = diffContributions('user1', oldCal, newCal);
    expect(result).toEqual([
      {
        type: 'contribution_added',
        payload: {
          username: 'user1',
          date: '2026-07-20',
          count: 1,
        },
      },
      {
        type: 'contribution_added',
        payload: {
          username: 'user1',
          date: '2026-07-21',
          count: 2,
        },
      },
    ]);
  });
});
