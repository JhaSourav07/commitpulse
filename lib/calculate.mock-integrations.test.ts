import { describe, expect, it } from 'vitest';
import { normalizeCalendarToTimezone } from './calculate';

describe('calculate-mock-integrations', () => {
  it('aggregates duplicate dates into a single normalized contribution entry', () => {
    const calendar = {
      totalContributions: 7,
      weeks: [
        {
          contributionDays: [
            { date: '2026-01-01', contributionCount: 2 },
            { date: '2026-01-01', contributionCount: 5 },
          ],
        },
      ],
      lastSyncedAt: '2026-01-02T00:00:00Z',
    };

    const result = normalizeCalendarToTimezone(calendar as never, 'UTC');

    expect(result.weeks).toHaveLength(1);
    expect(result.weeks[0].contributionDays).toEqual([
      {
        date: '2026-01-01',
        contributionCount: 7,
      },
    ]);
  });

  it('preserves totalContributions and lastSyncedAt metadata after normalization', () => {
    const calendar = {
      totalContributions: 123,
      lastSyncedAt: '2026-06-01T12:00:00Z',
      weeks: [
        {
          contributionDays: [{ date: '2026-06-01', contributionCount: 10 }],
        },
      ],
    };

    const result = normalizeCalendarToTimezone(calendar as never, 'Asia/Kolkata');

    expect(result.totalContributions).toBe(123);
    expect(result.lastSyncedAt).toBe('2026-06-01T12:00:00Z');
  });

  it('creates a new week when a Sunday boundary is encountered', () => {
    const calendar = {
      totalContributions: 3,
      weeks: [
        {
          contributionDays: [
            { date: '2026-01-02', contributionCount: 1 }, // Friday
            { date: '2026-01-03', contributionCount: 1 }, // Saturday
            { date: '2026-01-04', contributionCount: 1 }, // Sunday
          ],
        },
      ],
    };

    const result = normalizeCalendarToTimezone(calendar as never, 'UTC');

    expect(result.weeks).toHaveLength(2);

    expect(result.weeks[0].contributionDays).toEqual([
      { date: '2026-01-02', contributionCount: 1 },
      { date: '2026-01-03', contributionCount: 1 },
    ]);

    expect(result.weeks[1].contributionDays).toEqual([
      { date: '2026-01-04', contributionCount: 1 },
    ]);
  });

  it('sorts contribution dates chronologically before rebuilding weeks', () => {
    const calendar = {
      totalContributions: 6,
      weeks: [
        {
          contributionDays: [
            { date: '2026-01-03', contributionCount: 3 },
            { date: '2026-01-01', contributionCount: 1 },
            { date: '2026-01-02', contributionCount: 2 },
          ],
        },
      ],
    };

    const result = normalizeCalendarToTimezone(calendar as never, 'UTC');

    expect(result.weeks[0].contributionDays.map((day) => day.date)).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
    ]);
  });

  it('merges contribution counts for identical dates appearing across multiple source weeks', () => {
    const calendar = {
      totalContributions: 10,
      weeks: [
        {
          contributionDays: [
            { date: '2026-02-01', contributionCount: 2 },
            { date: '2026-02-02', contributionCount: 1 },
          ],
        },
        {
          contributionDays: [
            { date: '2026-02-01', contributionCount: 4 },
            { date: '2026-02-03', contributionCount: 3 },
          ],
        },
      ],
    };

    const result = normalizeCalendarToTimezone(calendar as never, 'UTC');

    const allDays = result.weeks.flatMap((week) => week.contributionDays);

    expect(allDays).toContainEqual({
      date: '2026-02-01',
      contributionCount: 6,
    });

    expect(allDays).toContainEqual({
      date: '2026-02-02',
      contributionCount: 1,
    });

    expect(allDays).toContainEqual({
      date: '2026-02-03',
      contributionCount: 3,
    });
  });
});
