import { describe, it, expect } from 'vitest';
import { themes } from './themes';
import { generateSVG } from './generator';
import { getLuminance } from './sanitizer';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';

describe('Nord Theme', () => {
  const mockStats: StreakStats = {
    currentStreak: 5,
    longestStreak: 10,
    totalContributions: 100,
    todayDate: '2024-06-12',
  };

  const mockCalendar: ContributionCalendar = {
    weeks: [
      {
        contributionDays: [{ contributionCount: 5, date: '2024-06-12' }],
      },
    ],
  } as ContributionCalendar;

  it('should exist as a theme key', () => {
    expect(themes.nord).toBeDefined();
  });

  it('should have valid hex background color', () => {
    expect(themes.nord.bg).toMatch(/^[0-9a-f]{6}$/i);
  });

  it('should have valid hex text color', () => {
    expect(themes.nord.text).toMatch(/^[0-9a-f]{6}$/i);
  });

  it('should have valid hex accent color', () => {
    expect(themes.nord.accent).toMatch(/^[0-9a-f]{6}$/i);
  });

  it('should generate SVG containing nord theme colors', () => {
    const svg = generateSVG(
      mockStats,
      {
        user: 'octocat',
        bg: themes.nord.bg,
        text: themes.nord.text,
        accent: themes.nord.accent,
      } as BadgeParams,
      mockCalendar
    );

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg.toLowerCase()).toContain(themes.nord.bg.toLowerCase());
    expect(svg.toLowerCase()).toContain(themes.nord.text.toLowerCase());
    expect(svg.toLowerCase()).toContain(themes.nord.accent.toLowerCase());
  });

  it('should provide sufficient contrast between bg and text', () => {
    const bgLum = getLuminance(themes.nord.bg);
    const textLum = getLuminance(themes.nord.text);

    const lighter = Math.max(bgLum, textLum);
    const darker = Math.min(bgLum, textLum);

    const contrastRatio = (lighter + 0.05) / (darker + 0.05);

    expect(contrastRatio).toBeGreaterThan(4.5);
  });
});
