import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('light theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('light');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.light.bg).toMatch(hexRegex);
    expect(themes.light.text).toMatch(hexRegex);
    expect(themes.light.accent).toMatch(hexRegex);
  });

  it('matches the defined light color values for the design spec', () => {
    expect(themes.light.bg).toBe('ffffff');
    expect(themes.light.text).toBe('24292f');
    expect(themes.light.accent).toBe('0969da');
  });

  it('contains the specific light hex colors in generated SVG output', () => {
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
    const lightParams: BadgeParams = {
      user: 'testuser',
      bg: themes.light.bg,
      text: themes.light.text,
      accent: themes.light.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, lightParams, mockCalendar);

    expect(svg).toContain(`#${themes.light.bg}`);
    expect(svg).toContain(`#${themes.light.text}`);
    expect(svg).toContain(`#${themes.light.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.light.bg, themes.light.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
