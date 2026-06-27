import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('highcontrast theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('highcontrast');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.highcontrast.bg).toMatch(hexRegex);
    expect(themes.highcontrast.text).toMatch(hexRegex);
    expect(themes.highcontrast.accent).toMatch(hexRegex);
  });

  it('matches the defined highcontrast color values for the design spec', () => {
    expect(themes.highcontrast.bg).toBe('0a0a0a');
    expect(themes.highcontrast.text).toBe('ffffff');
    expect(themes.highcontrast.accent).toBe('ff4500');
  });

  it('contains the specific highcontrast hex colors in generated SVG output', () => {
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
    const highcontrastParams: BadgeParams = {
      user: 'testuser',
      bg: themes.highcontrast.bg,
      text: themes.highcontrast.text,
      accent: themes.highcontrast.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, highcontrastParams, mockCalendar);

    expect(svg).toContain(`#${themes.highcontrast.bg}`);
    expect(svg).toContain(`#${themes.highcontrast.text}`);
    expect(svg).toContain(`#${themes.highcontrast.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.highcontrast.bg, themes.highcontrast.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
