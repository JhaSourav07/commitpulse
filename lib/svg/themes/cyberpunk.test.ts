import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('cyberpunk theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('cyberpunk');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.cyberpunk.bg).toMatch(hexRegex);
    expect(themes.cyberpunk.text).toMatch(hexRegex);
    expect(themes.cyberpunk.accent).toMatch(hexRegex);
  });

  it('matches the defined cyberpunk color values for the design spec', () => {
    expect(themes.cyberpunk.bg).toBe('fce22a');
    expect(themes.cyberpunk.text).toBe('111111');
    expect(themes.cyberpunk.accent).toBe('ff003c');
  });

  it('contains the specific cyberpunk hex colors in generated SVG output', () => {
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
      bg: themes.cyberpunk.bg,
      text: themes.cyberpunk.text,
      accent: themes.cyberpunk.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, defaultParams, mockCalendar);

    expect(svg).toContain(`#${themes.cyberpunk.bg}`);
    expect(svg).toContain(`#${themes.cyberpunk.text}`);
    expect(svg).toContain(`#${themes.cyberpunk.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.cyberpunk.bg, themes.cyberpunk.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
