import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';
import { contrastRatio } from './test-utils';

describe('gruvbox_light theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('gruvbox_light');
  });

  it('has valid 6-digit hex color strings (without #) for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;

    expect(themes.gruvbox_light.bg).toMatch(hexRegex);
    expect(themes.gruvbox_light.text).toMatch(hexRegex);
    expect(themes.gruvbox_light.accent).toMatch(hexRegex);
  });

  it('matches the defined gruvbox_light color values for the design spec', () => {
    expect(themes.gruvbox_light.bg).toBe('fbf1c7');
    expect(themes.gruvbox_light.text).toBe('3c3836');
    expect(themes.gruvbox_light.accent).toBe('d65d0e');
  });

  it('contains the specific gruvbox_light hex colors in generated SVG output', () => {
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
    const gruvboxParams: BadgeParams = {
      user: 'testuser',
      bg: themes.gruvbox_light.bg,
      text: themes.gruvbox_light.text,
      accent: themes.gruvbox_light.accent,
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, gruvboxParams, mockCalendar);

    expect(svg).toContain(`#${themes.gruvbox_light.bg}`);
    expect(svg).toContain(`#${themes.gruvbox_light.text}`);
    expect(svg).toContain(`#${themes.gruvbox_light.accent}`);
  });

  it('provides sufficient WCAG AA contrast between background and text', () => {
    const ratio = contrastRatio(themes.gruvbox_light.bg, themes.gruvbox_light.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
