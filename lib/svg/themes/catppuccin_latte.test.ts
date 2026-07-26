import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('catppuccin_latte theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('catppuccin_latte');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.catppuccin_latte.bg).toMatch(hexRegex);
    expect(themes.catppuccin_latte.text).toMatch(hexRegex);
    expect(themes.catppuccin_latte.accent).toMatch(hexRegex);
  });

  it('matches the defined catppuccin_latte color values for the design spec', () => {
    expect(themes.catppuccin_latte.bg).toBe('eff1f5');
    expect(themes.catppuccin_latte.text).toBe('4c4f69');
    expect(themes.catppuccin_latte.accent).toBe('1e66f5');
  });

  it('contains the specific catppuccin_latte hex colors in generated SVG output', () => {
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
    const catppuccinParams: BadgeParams = {
      user: 'testuser',
      bg: themes.catppuccin_latte.bg,
      text: themes.catppuccin_latte.text,
      accent: themes.catppuccin_latte.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, catppuccinParams, mockCalendar);

    expect(svg).toContain(`#${themes.catppuccin_latte.bg}`);
    expect(svg).toContain(`#${themes.catppuccin_latte.text}`);
    expect(svg).toContain(`#${themes.catppuccin_latte.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.catppuccin_latte.bg, themes.catppuccin_latte.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
