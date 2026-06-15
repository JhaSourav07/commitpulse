import { describe, it, expect } from 'vitest';
import { generateSVG } from './generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';
import { hexColor } from './sanitizer';

describe('generateSVG', () => {
  const stats: StreakStats = {
    currentStreak: 5,
    longestStreak: 10,
    totalContributions: 100,
    todayDate: '2026-06-09',
  };

  const calendar: ContributionCalendar = {
    totalContributions: 100,
    weeks: [],
  };

  const params: BadgeParams = {
    user: 'theme-test',
    bg: hexColor('0d1117'),
    text: hexColor('c9d1d9'),
    accent: hexColor('58a6ff'),
    speed: '8s',
    scale: 'linear',
    autoTheme: true,
  };

  it('generates a valid SVG document', () => {
    const svg = generateSVG(stats, params, calendar);

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('renders the username in the SVG', () => {
    const svg = generateSVG(stats, params, calendar);

    expect(svg).toContain('THEME-TEST');
  });

  it('renders streak labels and statistics', () => {
    const svg = generateSVG(stats, params, calendar);

    expect(svg).toContain('CURRENT_STREAK');
    expect(svg).toContain('PEAK_STREAK');
    expect(svg).toContain('ANNUAL_SYNC_TOTAL');

    expect(svg).toContain('5');
    expect(svg).toContain('10');
    expect(svg).toContain('100');
  });

  it('includes accessibility metadata', () => {
    const svg = generateSVG(stats, params, calendar);

    expect(svg).toContain('<title');
    expect(svg).toContain('<desc');
    expect(svg).toContain('role="img"');
  });

  it('handles an empty contribution calendar', () => {
    const emptyCalendar: ContributionCalendar = {
      totalContributions: 0,
      weeks: [],
    };

    const svg = generateSVG(stats, params, emptyCalendar);

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });
});
