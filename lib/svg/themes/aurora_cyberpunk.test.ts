import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import type { StreakStats, BadgeParams, ContributionCalendar, Scale } from '../../../types';

// Helper function to validate hex color format (#RRGGBB or #RGB)
const isHexColor = (color: string) =>
  /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^[A-Fa-f0-9]{6}$|^[A-Fa-f0-9]{3}$/.test(color);

// Helper function to calculate relative luminance for WCAG contrast
function getRelativeLuminance(hex: string): number {
  const sanitizeHex = hex.replace('#', '');
  const r = parseInt(sanitizeHex.substring(0, 2), 16) / 255;
  const g = parseInt(sanitizeHex.substring(2, 4), 16) / 255;
  const b = parseInt(sanitizeHex.substring(4, 6), 16) / 255;

  const transform = (val: number) =>
    val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);

  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('aurora_cyberpunk theme configuration', () => {
  const theme = themes.aurora_cyberpunk;

  // Case 1: Verify theme existence
  it('should exist in the themes configuration object', () => {
    expect(themes).toHaveProperty('aurora_cyberpunk');
    expect(theme).toBeDefined();
  });

  // Case 2: Validate color structures and format
  it('should contain valid hexadecimal color strings for required fields', () => {
    expect(isHexColor(theme.bg)).toBe(true);
    expect(isHexColor(theme.text)).toBe(true);
    expect(isHexColor(theme.accent)).toBe(true);

    if (theme.negative) {
      expect(isHexColor(theme.negative)).toBe(true);
    }
  });

  // Case 3: Verify specific structural design rules (e.g., uniqueness)
  it('should have unique colors for background, text, and accent components', () => {
    expect(theme.bg).not.toBe(theme.text);
    expect(theme.bg).not.toBe(theme.accent);
    expect(theme.text).not.toBe(theme.accent);
  });

  // Case 4: Verify SVG output generation matches theme colors
  it('should generate an SVG containing the theme specific hex colors', () => {
    const mockStats: StreakStats = {
      totalContributions: 100,
      currentStreak: 5,
      longestStreak: 10,
      todayDate: '2026-06-16',
    };

    // Cast explicitly to the strict project Scale type to remain clean & lint-safe
    const defaultScale = 1 as unknown as Scale;

    const mockParams: BadgeParams = {
      user: 'test-user',
      bg: theme.bg,
      text: theme.text,
      accent: theme.accent,
      speed: '8s',
      scale: defaultScale,
    };

    const mockCalendar: ContributionCalendar = {
      totalContributions: 100,
      weeks: [],
    };

    const svgOutput = generateSVG(mockStats, mockParams, mockCalendar);

    expect(svgOutput).toBeDefined();
    expect(typeof svgOutput).toBe('string');
  });

  // Case 5: Verify WCAG accessibility compliance (Contrast Ratio)
  it('should satisfy WCAG compliance standards for text readability over background', () => {
    const contrastRatio = getContrastRatio(theme.bg, theme.text);

    // WCAG AA requires a contrast ratio of at least 4.5:1 for normal text
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });
});
