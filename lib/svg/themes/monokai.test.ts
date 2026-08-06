import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('monokai theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('monokai');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.monokai.bg).toMatch(hexRegex);
    expect(themes.monokai.text).toMatch(hexRegex);
    expect(themes.monokai.accent).toMatch(hexRegex);
  });

  it('matches the defined monokai color values for the design spec', () => {
    expect(themes.monokai.bg).toBe('272822');
    expect(themes.monokai.text).toBe('f8f8f2');
    expect(themes.monokai.accent).toBe('a6e22e');
  });

  it('contains the specific monokai hex colors in generated SVG output', () => {
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
      bg: themes.monokai.bg,
      text: themes.monokai.text,
      accent: themes.monokai.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, defaultParams, mockCalendar);

    expect(svg).toContain(`#${themes.monokai.bg}`);
    expect(svg).toContain(`#${themes.monokai.text}`);
    expect(svg).toContain(`#${themes.monokai.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.monokai.bg, themes.monokai.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
