import { describe, it, expect } from 'vitest';
import { aggregateCalendars } from './calculate';
import type { ContributionCalendar } from '../types';

describe('aggregate large organization behavior', () => {
  it('aggregates 100 contributor calendars correctly', () => {
    const calendars: ContributionCalendar[] = Array.from({ length: 100 }, (_, user) => ({
      totalContributions: 365,
      weeks: [
        {
          contributionDays: Array.from({ length: 365 }, (_, day) => ({
            date: new Date(Date.UTC(2024, 0, day + 1)).toISOString().split('T')[0],
            contributionCount: user + 1,
          })),
        },
      ],
    }));

    const result = aggregateCalendars(calendars);

    expect(result.totalContributions).toBe(36500);
  });

  it('preserves all contribution dates after aggregation', () => {
    const calendars: ContributionCalendar[] = [
      {
        totalContributions: 10,
        weeks: [
          {
            contributionDays: [
              { date: '2024-01-01', contributionCount: 5 },
              { date: '2024-01-02', contributionCount: 5 },
            ],
          },
        ],
      },
      {
        totalContributions: 10,
        weeks: [
          {
            contributionDays: [
              { date: '2024-01-03', contributionCount: 5 },
              { date: '2024-01-04', contributionCount: 5 },
            ],
          },
        ],
      },
    ];

    const result = aggregateCalendars(calendars);

    const dates = result.weeks.flatMap((w) => w.contributionDays.map((d) => d.date));

    expect(dates).toContain('2024-01-01');
    expect(dates).toContain('2024-01-02');
    expect(dates).toContain('2024-01-03');
    expect(dates).toContain('2024-01-04');
  });

  it('correctly merges overlapping contribution dates', () => {
    const calendars: ContributionCalendar[] = [
      {
        totalContributions: 5,
        weeks: [
          {
            contributionDays: [{ date: '2024-01-01', contributionCount: 2 }],
          },
        ],
      },
      {
        totalContributions: 7,
        weeks: [
          {
            contributionDays: [{ date: '2024-01-01', contributionCount: 3 }],
          },
        ],
      },
    ];

    const result = aggregateCalendars(calendars);

    const day = result.weeks
      .flatMap((w) => w.contributionDays)
      .find((d) => d.date === '2024-01-01');

    expect(day?.contributionCount).toBe(5);
  });

  it('handles 500 contributor organization datasets', () => {
    const calendars: ContributionCalendar[] = Array.from({ length: 500 }, () => ({
      totalContributions: 100,
      weeks: [
        {
          contributionDays: [
            {
              date: '2024-01-01',
              contributionCount: 100,
            },
          ],
        },
      ],
    }));

    const result = aggregateCalendars(calendars);

    expect(result.totalContributions).toBe(50000);

    const day = result.weeks
      .flatMap((w) => w.contributionDays)
      .find((d) => d.date === '2024-01-01');

    expect(day?.contributionCount).toBe(50000);
  });

  it('performs aggregation efficiently on large datasets', () => {
    const calendars: ContributionCalendar[] = Array.from({ length: 300 }, (_, user) => ({
      totalContributions: 365,
      weeks: [
        {
          contributionDays: Array.from({ length: 365 }, (_, day) => ({
            date: new Date(Date.UTC(2023, 0, day + 1)).toISOString().split('T')[0],
            contributionCount: user + 1,
          })),
        },
      ],
    }));

    const start = performance.now();

    const result = aggregateCalendars(calendars);

    const duration = performance.now() - start;

    expect(result.totalContributions).toBeGreaterThan(0);
    expect(duration).toBeLessThan(2000);
  });
});
