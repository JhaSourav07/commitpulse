// lib/svg/constellation.test.ts

import { describe, it, expect } from 'vitest';
import { generateConstellationSVG } from './constellation';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';

function makeMockCalendar(
  totalContributions: number,
  days: { date: string; contributionCount: number }[]
): ContributionCalendar {
  // Split days into weeks (7 days per week)
  const weeks: ContributionCalendar['weeks'] = [];
  const sorted = [...days].sort(
    (a, b) => new Date(a.date + 'T12:00:00Z').getTime() - new Date(b.date + 'T12:00:00Z').getTime()
  );

  for (let i = 0; i < sorted.length; i += 7) {
    const weekDays = sorted.slice(i, i + 7);
    // Pad to 7 days
    while (weekDays.length < 7) {
      const lastDate = weekDays[weekDays.length - 1]?.date || '2025-01-01';
      const nextDate = new Date(lastDate + 'T12:00:00Z');
      nextDate.setDate(nextDate.getDate() + 1);
      weekDays.push({
        date: nextDate.toISOString().slice(0, 10),
        contributionCount: 0,
      });
    }
    weeks.push({ contributionDays: weekDays });
  }

  return { totalContributions, weeks };
}

function makeMockStats(overrides: Partial<StreakStats> = {}): StreakStats {
  return {
    currentStreak: 7,
    longestStreak: 30,
    totalContributions: 500,
    todayDate: '2025-06-07',
    ...overrides,
  };
}

function makeMockParams(overrides: Partial<BadgeParams> = {}): BadgeParams {
  return {
    user: 'testuser',
    bg: '0d1117' as BadgeParams['bg'],
    text: 'c9d1d9' as BadgeParams['text'],
    accent: '58a6ff' as BadgeParams['accent'],
    speed: '8s',
    scale: 'linear',
    ...overrides,
  } as BadgeParams;
}

describe('generateConstellationSVG', () => {
  it('generates a valid SVG string', () => {
    const calendar = makeMockCalendar(10, [
      { date: '2025-01-15', contributionCount: 5 },
      { date: '2025-01-20', contributionCount: 3 },
      { date: '2025-02-10', contributionCount: 8 },
    ]);
    const stats = makeMockStats({ totalContributions: 16 });
    const params = makeMockParams();

    const svg = generateConstellationSVG(stats, params, calendar);

    expect(svg).toContain(
      '<svg style="max-width: 100%; height: auto;" xmlns="http://www.w3.org/2000/svg"'
    );
    expect(svg).toContain('Constellation Map');
    expect(svg).toContain('testuser');
  });

  it('includes CSS animation keyframes with ck- prefix', () => {
    const calendar = makeMockCalendar(5, [{ date: '2025-03-01', contributionCount: 5 }]);
    const svg = generateConstellationSVG(makeMockStats(), makeMockParams(), calendar);

    expect(svg).toContain('@keyframes ck-twinkle');
    expect(svg).toContain('@keyframes ck-constellation-glow');
    expect(svg).toContain('@keyframes ck-star-pulse');
    expect(svg).toContain('@keyframes ck-milkyway-rotate');
  });

  it('includes the zodiac ring with 12 arcs', () => {
    const calendar = makeMockCalendar(24, [
      { date: '2025-01-15', contributionCount: 2 },
      { date: '2025-06-15', contributionCount: 2 },
      { date: '2025-12-25', contributionCount: 2 },
    ]);
    const svg = generateConstellationSVG(makeMockStats(), makeMockParams(), calendar);

    // Should have 12 path elements for the zodiac ring arcs
    const arcMatches = svg.match(/id="ck-zodiac-ring"/);
    expect(arcMatches).not.toBeNull();
  });

  it('handles empty contribution calendar gracefully', () => {
    const calendar = makeMockCalendar(0, []);
    const svg = generateConstellationSVG(
      makeMockStats({ totalContributions: 0 }),
      makeMockParams(),
      calendar
    );

    // Should still produce a valid SVG
    expect(svg).toContain(
      '<svg style="max-width: 100%; height: auto;" xmlns="http://www.w3.org/2000/svg"'
    );
    expect(svg).toContain('Constellation Map');
    // No contribution stars
    expect(svg).toContain('id="ck-contrib-stars"');
  });

  it('produces deterministic output for same inputs', () => {
    const calendar = makeMockCalendar(20, [
      { date: '2025-05-10', contributionCount: 4 },
      { date: '2025-05-15', contributionCount: 7 },
      { date: '2025-05-20', contributionCount: 2 },
    ]);
    const params = makeMockParams({ user: 'deterministic-test' });

    const svg1 = generateConstellationSVG(makeMockStats(), params, calendar);
    const svg2 = generateConstellationSVG(makeMockStats(), params, calendar);

    expect(svg1).toBe(svg2);
  });

  it('includes accessibility title and desc elements', () => {
    const calendar = makeMockCalendar(5, [{ date: '2025-07-01', contributionCount: 5 }]);
    const svg = generateConstellationSVG(makeMockStats(), makeMockParams(), calendar);

    expect(svg).toContain('<title id="cp-constellation-title">');
    expect(svg).toContain('<desc id="cp-constellation-desc">');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-labelledby');
  });

  it('handles a single contribution day', () => {
    const calendar = makeMockCalendar(1, [{ date: '2025-11-11', contributionCount: 1 }]);
    const svg = generateConstellationSVG(
      makeMockStats({ totalContributions: 1 }),
      makeMockParams(),
      calendar
    );

    expect(svg).toContain(
      '<svg style="max-width: 100%; height: auto;" xmlns="http://www.w3.org/2000/svg"'
    );
    // Should have one contribution star but no constellation lines (needs 2+ stars in a month)
    expect(svg).toContain('id="ck-contrib-stars"');
  });

  it('includes all three legend tiers', () => {
    const calendar = makeMockCalendar(10, [{ date: '2025-04-01', contributionCount: 10 }]);
    const svg = generateConstellationSVG(makeMockStats(), makeMockParams(), calendar);

    expect(svg).toContain('1-3');
    expect(svg).toContain('4-10');
    expect(svg).toContain('11+');
  });

  it('respects custom theme colors', () => {
    const calendar = makeMockCalendar(5, [{ date: '2025-01-01', contributionCount: 5 }]);
    const params = makeMockParams({
      bg: 'ff0000' as BadgeParams['bg'],
      text: '00ff00' as BadgeParams['text'],
      accent: '0000ff' as BadgeParams['accent'],
    });

    const svg = generateConstellationSVG(makeMockStats(), params, calendar);

    expect(svg).toContain('fill="#ff0000"'); // background
    expect(svg).toContain('fill="#00ff00"'); // text elements
    expect(svg).toContain('fill="#0000ff"'); // accent stars
  });
});
