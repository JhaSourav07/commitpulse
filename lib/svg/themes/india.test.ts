import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('india theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('india');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.india.bg).toMatch(hexRegex);
    expect(themes.india.text).toMatch(hexRegex);
    expect(themes.india.accent).toMatch(hexRegex);
  });

  it('matches the defined india color values for the design spec', () => {
    expect(themes.india.bg).toBe('0a0a0a');
    expect(themes.india.text).toBe('ffffff');
    expect(themes.india.accent).toBe('FF9933');
  });

  it('contains the specific india hex colors in generated SVG output', () => {
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
      bg: themes.india.bg,
      text: themes.india.text,
      accent: themes.india.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, defaultParams, mockCalendar);

    expect(svg).toContain(`#${themes.india.bg}`);
    expect(svg).toContain(`#${themes.india.text}`);
    expect(svg).toContain(`#${themes.india.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.india.bg, themes.india.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
