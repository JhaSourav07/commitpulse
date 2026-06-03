import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../../types';

describe('neon theme', () => {
  it('exists as a key in the themes object', () => {
    expect(themes).toHaveProperty('neon');
  });

  it('has valid hexadecimal color strings for bg, text, and accent', () => {
    const hexRegex = /^[0-9a-fA-F]{6}$/;
    const neon = themes.neon;
    expect(neon).toBeDefined();

    expect(neon.bg).toMatch(hexRegex);
    expect(neon.text).toMatch(hexRegex);
    expect(neon.accent).toMatch(hexRegex);
  });

  it('contains the specific neon hex colors in generated SVG output', () => {
    const mockStats: StreakStats = {
      currentStreak: 5,
      longestStreak: 10,
      totalContributions: 100,
      todayDate: '2024-06-12',
    };
    const mockCalendar = {
      weeks: [
        {
          contributionDays: [
            { contributionCount: 5, date: '2024-06-11' },
            { contributionCount: 5, date: '2024-06-12' },
          ],
        },
      ],
    } as ContributionCalendar;
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
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    };

    const relativeLuminance = (hex: string) => {
      const { r, g, b } = hexToRgb(hex);
      const [rl, gl, bl] = [r, g, b].map((c) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
    };

    const { bg, text } = themes.neon;
    const lBg = relativeLuminance(bg);
    const lText = relativeLuminance(text);
    const lighter = Math.max(lBg, lText);
    const darker = Math.min(lBg, lText);
    const contrast = (lighter + 0.05) / (darker + 0.05);

    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });
});
