import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('dracula theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('dracula');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.dracula.bg).toMatch(hexRegex);
    expect(themes.dracula.text).toMatch(hexRegex);
    expect(themes.dracula.accent).toMatch(hexRegex);
  });

  it('matches the defined dracula color values for the design spec', () => {
    expect(themes.dracula.bg).toBe('282a36');
    expect(themes.dracula.text).toBe('f8f8f2');
    expect(themes.dracula.accent).toBe('bd93f9');
  });

  it('contains the specific dracula hex colors in generated SVG output', () => {
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
    const draculaParams: BadgeParams = {
      user: 'testuser',
      bg: themes.dracula.bg,
      text: themes.dracula.text,
      accent: themes.dracula.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, draculaParams, mockCalendar);

    expect(svg).toContain(`#${themes.dracula.bg}`);
    expect(svg).toContain(`#${themes.dracula.text}`);
    expect(svg).toContain(`#${themes.dracula.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.dracula.bg, themes.dracula.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
