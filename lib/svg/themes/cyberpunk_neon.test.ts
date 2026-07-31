import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('cyberpunk_neon theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('cyberpunk_neon');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.cyberpunk_neon.bg).toMatch(hexRegex);
    expect(themes.cyberpunk_neon.text).toMatch(hexRegex);
    expect(themes.cyberpunk_neon.accent).toMatch(hexRegex);
  });

  it('matches the defined cyberpunk_neon color values for the design spec', () => {
    expect(themes.cyberpunk_neon.bg).toBe('0d0d14');
    expect(themes.cyberpunk_neon.text).toBe('00f3ff');
    expect(themes.cyberpunk_neon.accent).toBe('ff0055');
  });

  it('contains the specific cyberpunk_neon hex colors in generated SVG output', () => {
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
      bg: themes.cyberpunk_neon.bg,
      text: themes.cyberpunk_neon.text,
      accent: themes.cyberpunk_neon.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, defaultParams, mockCalendar);

    expect(svg).toContain(`#${themes.cyberpunk_neon.bg}`);
    expect(svg).toContain(`#${themes.cyberpunk_neon.text}`);
    expect(svg).toContain(`#${themes.cyberpunk_neon.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.cyberpunk_neon.bg, themes.cyberpunk_neon.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
