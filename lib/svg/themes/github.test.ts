import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('github theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('github');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.github.bg).toMatch(hexRegex);
    expect(themes.github.text).toMatch(hexRegex);
    expect(themes.github.accent).toMatch(hexRegex);
  });

  it('matches the defined github color values for the design spec', () => {
    expect(themes.github.bg).toBe('0d1117');
    expect(themes.github.text).toBe('ffffff');
    expect(themes.github.accent).toBe('238636');
  });

  it('contains the specific github hex colors in generated SVG output', () => {
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
      bg: themes.github.bg,
      text: themes.github.text,
      accent: themes.github.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, defaultParams, mockCalendar);

    expect(svg).toContain(`#${themes.github.bg}`);
    expect(svg).toContain(`#${themes.github.text}`);
    expect(svg).toContain(`#${themes.github.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.github.bg, themes.github.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
