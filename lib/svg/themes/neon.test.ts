import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('neon theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('neon');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.neon.bg).toMatch(hexRegex);
    expect(themes.neon.text).toMatch(hexRegex);
    expect(themes.neon.accent).toMatch(hexRegex);
  });

  it('contains the specific neon hex colors in generated SVG output', () => {
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
    const neonParams: BadgeParams = {
      user: 'testuser',
      bg: themes.neon.bg,
      text: themes.neon.text,
      accent: themes.neon.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, neonParams, mockCalendar);

    expect(svg).toContain(`#${themes.neon.bg}`);
    expect(svg).toContain(`#${themes.neon.text}`);
    expect(svg).toContain(`#${themes.neon.accent}`);
  });

  it('matches the defined neon color values for the design spec', () => {
    expect(themes.neon.bg).toBe('000000');
    expect(themes.neon.text).toBe('00ffcc');
    expect(themes.neon.accent).toBe('ff00ff');
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.neon.bg, themes.neon.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
