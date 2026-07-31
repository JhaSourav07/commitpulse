import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('enterprise theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('enterprise');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.enterprise.bg).toMatch(hexRegex);
    expect(themes.enterprise.text).toMatch(hexRegex);
    expect(themes.enterprise.accent).toMatch(hexRegex);
  });

  it('matches the defined enterprise color values for the design spec', () => {
    expect(themes.enterprise.bg).toBe('1a1a2e');
    expect(themes.enterprise.text).toBe('e2e8f0');
    expect(themes.enterprise.accent).toBe('6366f1');
  });

  it('contains the specific enterprise hex colors in generated SVG output', () => {
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
      bg: themes.enterprise.bg,
      text: themes.enterprise.text,
      accent: themes.enterprise.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, defaultParams, mockCalendar);

    expect(svg).toContain(`#${themes.enterprise.bg}`);
    expect(svg).toContain(`#${themes.enterprise.text}`);
    expect(svg).toContain(`#${themes.enterprise.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.enterprise.bg, themes.enterprise.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
