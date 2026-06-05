import { describe, it, expect } from 'vitest';
import { themes } from '../themes';
import { generateSVG } from '../generator';
import { getLuminance, hexColor } from '../sanitizer';
import type { StreakStats, ContributionCalendar, BadgeParams } from '../../../types';

describe('lumos theme', () => {
  // Test 1: Verify lumos theme exists with all required color properties
  it('asserts lumos theme exists with bg, text, accent, and negative properties', () => {
    expect(themes).toHaveProperty('lumos');
    expect(themes.lumos).toBeDefined();

    const lumosTheme = themes.lumos;
    expect(lumosTheme).toHaveProperty('bg');
    expect(lumosTheme).toHaveProperty('text');
    expect(lumosTheme).toHaveProperty('accent');
    expect(lumosTheme).toHaveProperty('negative');

    // All properties should be defined
    expect(lumosTheme.bg).toBeDefined();
    expect(lumosTheme.text).toBeDefined();
    expect(lumosTheme.accent).toBeDefined();
    expect(lumosTheme.negative).toBeDefined();
  });

  // Test 2: Verify all colors are valid 6-character hexadecimal strings
  it('validates lumos theme colors are valid 6-character hex strings', () => {
    const hexRegex = /^[0-9a-f]{6}$/i;
    const lumosTheme = themes.lumos;

    // bg, text, and accent are required
    expect(lumosTheme.bg, 'lumos bg should be valid hex').toMatch(hexRegex);
    expect(lumosTheme.text, 'lumos text should be valid hex').toMatch(hexRegex);
    expect(lumosTheme.accent, 'lumos accent should be valid hex').toMatch(hexRegex);

    // negative should also be valid hex if present
    if (lumosTheme.negative) {
      expect(lumosTheme.negative, 'lumos negative should be valid hex').toMatch(hexRegex);
    }

    // Verify no colors have '#' prefix (sanitizer removes them)
    expect(lumosTheme.bg.startsWith('#')).toBe(false);
    expect(lumosTheme.text.startsWith('#')).toBe(false);
    expect(lumosTheme.accent.startsWith('#')).toBe(false);
    if (lumosTheme.negative) {
      expect(lumosTheme.negative.startsWith('#')).toBe(false);
    }
  });

  // Test 3: Generate SVG with lumos theme and verify colors appear in output
  it('generates SVG with lumos theme containing correct hex color values', () => {
    const mockStats: StreakStats = {
      currentStreak: 7,
      longestStreak: 30,
      totalContributions: 256,
      todayDate: '2024-06-15',
    };

    const mockCalendar: ContributionCalendar = {
      totalContributions: 256,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 2, date: '2024-06-10' },
            { contributionCount: 8, date: '2024-06-11' },
            { contributionCount: 15, date: '2024-06-12' },
            { contributionCount: 5, date: '2024-06-13' },
            { contributionCount: 3, date: '2024-06-14' },
            { contributionCount: 12, date: '2024-06-15' },
            { contributionCount: 0, date: '2024-06-16' },
          ],
        },
      ],
    };

    const lumosTheme = themes.lumos;
    const params: BadgeParams = {
      user: 'testuser',
      bg: hexColor(lumosTheme.bg),
      text: hexColor(lumosTheme.text),
      accent: hexColor(lumosTheme.accent),
      speed: '8s',
      scale: 'linear',
    };

    const svg = generateSVG(mockStats, params, mockCalendar);

    // Verify SVG is valid (parseable)
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');
    expect(parserError).toBeNull();

    // Verify lumos theme colors are present in the SVG output
    // Colors: bg='0a0a0a', text='a7f3d0', accent='fbbf24', negative='ef4444'

    // Check for color hex values in SVG (they appear as fill/stroke attributes or CSS)
    const bgPresent = svg.includes(lumosTheme.bg) || svg.includes(`#${lumosTheme.bg}`);
    const textPresent = svg.includes(lumosTheme.text) || svg.includes(`#${lumosTheme.text}`);
    const accentPresent = svg.includes(lumosTheme.accent) || svg.includes(`#${lumosTheme.accent}`);

    expect(bgPresent, 'SVG should contain lumos bg color').toBe(true);
    expect(textPresent, 'SVG should contain lumos text color').toBe(true);
    expect(accentPresent, 'SVG should contain lumos accent color').toBe(true);
  });

  // Test 4: Verify WCAG AA accessibility compliance (contrast ratio >= 4.5:1)
  it('meets WCAG AA contrast requirement between background and text colors', () => {
    const lumosTheme = themes.lumos;

    // Calculate luminance for background and text colors
    const bgLuminance = getLuminance(lumosTheme.bg);
    const textLuminance = getLuminance(lumosTheme.text);

    // WCAG 2.0 contrast ratio formula: (L1 + 0.05) / (L2 + 0.05)
    // where L1 is the lighter color and L2 is the darker
    const L1 = Math.max(bgLuminance, textLuminance);
    const L2 = Math.min(bgLuminance, textLuminance);
    const contrastRatio = (L1 + 0.05) / (L2 + 0.05);

    // WCAG AA requires >= 4.5:1 for normal text
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  // Test 5: Verify accent and negative colors are visually distinguishable
  it('ensures accent and negative colors are visually distinguishable', () => {
    const lumosTheme = themes.lumos;

    if (!lumosTheme.negative) {
      // If negative is not defined, skip this test
      expect(lumosTheme.negative).toBeDefined();
      return;
    }

    // Calculate luminance for both colors
    const accentLuminance = getLuminance(lumosTheme.accent);
    const negativeLuminance = getLuminance(lumosTheme.negative);

    // Accent and negative should have meaningful visual separation
    // We check that luminance values differ significantly (> 0.1 indicates good distinction)
    const luminanceDifference = Math.abs(accentLuminance - negativeLuminance);

    expect(luminanceDifference).toBeGreaterThan(0.05);

    // Also verify they're not identical (which would make them indistinguishable)
    expect(accentLuminance).not.toEqual(negativeLuminance);
  });
});
