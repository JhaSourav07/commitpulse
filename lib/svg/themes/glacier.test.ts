import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('glacier theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('glacier');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.glacier.bg).toMatch(hexRegex);
    expect(themes.glacier.text).toMatch(hexRegex);
    expect(themes.glacier.accent).toMatch(hexRegex);
  });

  it('matches the defined glacier color values for the design spec', () => {
    expect(themes.glacier.bg).toBe('e0f2fe');
    expect(themes.glacier.text).toBe('0369a1');
    expect(themes.glacier.accent).toBe('06b6d4');
  });

  it('contains the specific glacier hex colors in generated SVG output', () => {
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
      bg: themes.glacier.bg,
      text: themes.glacier.text,
      accent: themes.glacier.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, defaultParams, mockCalendar);

    expect(svg).toContain(`#${themes.glacier.bg}`);
    expect(svg).toContain(`#${themes.glacier.text}`);
    expect(svg).toContain(`#${themes.glacier.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.glacier.bg, themes.glacier.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
