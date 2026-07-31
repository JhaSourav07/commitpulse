import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('default theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('default');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.default.bg).toMatch(hexRegex);
    expect(themes.default.text).toMatch(hexRegex);
    expect(themes.default.accent).toMatch(hexRegex);
  });

  it('matches the defined default color values for the design spec', () => {
    expect(themes.default.bg).toBe('0d1117');
    expect(themes.default.text).toBe('ffffff');
    expect(themes.default.accent).toBe('2da44e');
  });

  it('contains the specific default hex colors in generated SVG output', () => {
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
      bg: themes.default.bg,
      text: themes.default.text,
      accent: themes.default.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, defaultParams, mockCalendar);

    expect(svg).toContain(`#${themes.default.bg}`);
    expect(svg).toContain(`#${themes.default.text}`);
    expect(svg).toContain(`#${themes.default.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.default.bg, themes.default.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
