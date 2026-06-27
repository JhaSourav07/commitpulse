import { describe, it, expect } from 'vitest';
import { generateWrappedSVG } from './generator';
import type { BadgeParams } from '@/types';
import type { WrappedStats } from '@/types/dashboard';

const params = {
  user: 'tester',
  bg: '0d1117',
  text: 'ffffff',
  accent: '00ffaa',
  speed: '8s',
  scale: 'linear',
} as unknown as BadgeParams;

const emptyCalendar = { totalContributions: 0, weeks: [] };

function makeStats(overrides: Partial<WrappedStats>): WrappedStats {
  return {
    totalContributions: 100,
    mostActiveDate: '2025-03-15',
    highestDailyCount: 12,
    busiestMonth: '2025-03',
    weekendRatio: 30,
    topLanguage: 'TypeScript',
    calendar: emptyCalendar,
    ...overrides,
  } as WrappedStats;
}

describe('generateWrappedSVG escaping', () => {
  it('escapes XML metacharacters in topLanguage', () => {
    const stats = makeStats({ topLanguage: 'C++<img src=x onerror=alert(1)>' });
    const svg = generateWrappedSVG(stats, params, '2025', stats.calendar);

    expect(svg).not.toContain('<img src=x');
    expect(svg).toContain('C++&lt;img src=x onerror=alert(1)&gt;');
  });

  it('escapes XML metacharacters in busiestMonth and the derived month name', () => {
    const stats = makeStats({ busiestMonth: '2025-<script>' });
    const svg = generateWrappedSVG(stats, params, '2025', stats.calendar);

    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('escapes ampersands in the peak date value', () => {
    const stats = makeStats({ mostActiveDate: 'A&B' });
    const svg = generateWrappedSVG(stats, params, '2025', stats.calendar);

    expect(svg).toContain('A&amp;B');
  });

  it('renders ordinary values normally', () => {
    const stats = makeStats({ topLanguage: 'TypeScript' });
    const svg = generateWrappedSVG(stats, params, '2025', stats.calendar);

    expect(svg).toContain('TypeScript');
  });
});
