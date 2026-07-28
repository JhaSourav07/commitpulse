import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('solarized_light theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('solarized_light');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.solarized_light.bg).toMatch(hexRegex);
    expect(themes.solarized_light.text).toMatch(hexRegex);
    expect(themes.solarized_light.accent).toMatch(hexRegex);
  });

  it('matches the defined solarized_light color values for the design spec', () => {
    expect(themes.solarized_light.bg).toBe('fdf6e3');
    expect(themes.solarized_light.text).toBe('586e75');
    expect(themes.solarized_light.accent).toBe('268bd2');
  });

  it('contains the specific solarized_light hex colors in generated SVG output', () => {
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
      bg: themes.solarized_light.bg,
      text: themes.solarized_light.text,
      accent: themes.solarized_light.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, defaultParams, mockCalendar);

    expect(svg).toContain(`#${themes.solarized_light.bg}`);
    expect(svg).toContain(`#${themes.solarized_light.text}`);
    expect(svg).toContain(`#${themes.solarized_light.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.solarized_light.bg, themes.solarized_light.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
