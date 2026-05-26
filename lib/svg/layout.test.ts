import { describe, it, expect } from 'vitest';
import { computeTowers } from './layout';
import type { ContributionCalendar } from '../../types';

describe('computeTowers tooltip format', () => {
  it('adds TODAY prefix for today tower with commits', () => {
    const calendar: ContributionCalendar = {
      weeks: [
        {
          contributionDays: [
            {
              contributionCount: 5,
              date: '2024-06-12',
            },
          ],
        },
      ],
    } as ContributionCalendar;

    const towers = computeTowers(calendar, 'linear', '2024-06-12');

    expect(towers[0].tooltip).toContain('TODAY:');
  });

  it('does not add TODAY prefix for non-today tower', () => {
    const calendar: ContributionCalendar = {
      weeks: [
        {
          contributionDays: [
            {
              contributionCount: 5,
              date: '2024-06-10',
            },
            {
              contributionCount: 2,
              date: '2024-06-12',
            },
          ],
        },
      ],
    } as ContributionCalendar;

    const towers = computeTowers(calendar, 'linear', '2024-06-12');

    expect(towers[0].tooltip).not.toContain('TODAY:');
  });
});
