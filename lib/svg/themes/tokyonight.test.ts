import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('tokyonight theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('tokyonight');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.tokyonight.bg).toMatch(hexRegex);
    expect(themes.tokyonight.text).toMatch(hexRegex);
    expect(themes.tokyonight.accent).toMatch(hexRegex);
  });

  it('matches the defined tokyonight color values for the design spec', () => {
    expect(themes.tokyonight.bg).toBe('1a1b26');
    expect(themes.tokyonight.text).toBe('c0caf5');
    expect(themes.tokyonight.accent).toBe('f7768e');
  });

  it('contains the specific tokyonight hex colors in generated SVG output', () => {
    const mockStats: StreakStats = {
      currentStreak: 5,
      longestStreak: 10,
      totalContributions: 100,
      todayDate: '2024-06-12',
    };
    const mockCalendar: ContributionCalendar = {
      totalContributions: 10,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 5, date: '2024-06-11' },
            { contributionCount: 5, date: '2024-06-12' },
          ],
        },
      ],
    };
    const defaultParams: BadgeParams = {
      user: 'testuser',
      bg: themes.tokyonight.bg,
      text: themes.tokyonight.text,
      accent: themes.tokyonight.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, defaultParams, mockCalendar);

    expect(svg).toContain(`#${themes.tokyonight.bg}`);
    expect(svg).toContain(`#${themes.tokyonight.text}`);
    expect(svg).toContain(`#${themes.tokyonight.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.tokyonight.bg, themes.tokyonight.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
