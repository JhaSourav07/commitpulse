// lib/svg/themes/forest.test.ts
import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';

describe('forest theme', () => {
  const hexRegex = /^#[0-9a-f]{6}$/i;

  const mockStats: StreakStats = {
    currentStreak: 3,
    longestStreak: 7,
    totalContributions: 42,
    todayDate: '2024-06-12',
  };

  const mockCalendar = {
    weeks: [
      {
        contributionDays: [
          { contributionCount: 0, date: '2024-06-10' },
          { contributionCount: 4, date: '2024-06-11' },
          { contributionCount: 9, date: '2024-06-12' },
        ],
      },
    ],
  } as ContributionCalendar;

  it('imports the themes object and asserts the forest key exists', () => {
    expect(themes).toHaveProperty('forest');
    expect(themes.forest).toBeDefined();
  });

  it('verifies themes.forest.bg is a valid 6-character hex color', () => {
    expect(`#${themes.forest.bg}`, 'forest bg is invalid').toMatch(hexRegex);
  });

  it('verifies themes.forest.text is a valid 6-character hex color', () => {
    expect(`#${themes.forest.text}`, 'forest text is invalid').toMatch(hexRegex);
  });

  it('verifies themes.forest.accent is a valid 6-character hex color', () => {
    expect(`#${themes.forest.accent}`, 'forest accent is invalid').toMatch(hexRegex);
  });

  it('generates an SVG using the forest theme and asserts theme hex colors appear in the output', () => {
    const forest = themes.forest;

    const svg = generateSVG(
      mockStats,
      {
        user: 'tester',
        bg: forest.bg,
        text: forest.text,
        accent: forest.accent,
        speed: '8s',
        scale: 'linear',
      } as unknown as BadgeParams,
      mockCalendar
    );

    expect(svg).toBeTypeOf('string');
    expect(svg.length).toBeGreaterThan(0);
    // The generator prepends '#' to the sanitized hex values
    expect(svg).toContain(`#${forest.bg}`);
    expect(svg).toContain(`#${forest.text}`);
    expect(svg).toContain(`#${forest.accent}`);
  });

  it('ensures the contrast between forest bg and text is sufficient (WCAG accessibility)', () => {
    const hexToRgb = (hex: string): [number, number, number] => {
      const h = hex.replace('#', '');
      return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16),
      ];
    };

    const luminance = ([r, g, b]: [number, number, number]): number => {
      const a = [r, g, b].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    };

    const bgLum = luminance(hexToRgb(themes.forest.bg));
    const textLum = luminance(hexToRgb(themes.forest.text));
    const lighter = Math.max(bgLum, textLum);
    const darker = Math.min(bgLum, textLum);
    const contrastRatio = (lighter + 0.05) / (darker + 0.05);

    // WCAG AA requires at least 4.5:1 for normal text
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });
});
