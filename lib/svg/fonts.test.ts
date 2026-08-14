import { describe, it, expect } from 'vitest';
import FONT_MAP, { resolveFontFamily, isPredefinedFontKey, DEFAULT_FONTS_BASE64 } from './fonts';
import { generateSVG } from './generator';
import type { BadgeParams, ContributionCalendar, StreakStats } from '../../types';

describe('fonts.resolveFontFamily', () => {
  it('returns predefined stack for known keys (case-insensitive)', () => {
    expect(resolveFontFamily('jetbrains')).toBe(FONT_MAP.jetbrains);
    expect(resolveFontFamily('JetBrains')).toBe(FONT_MAP.jetbrains);
    expect(resolveFontFamily('FIRA')).toBe(FONT_MAP.fira);
  });

  it('returns a dynamic font-family for custom font names', () => {
    expect(resolveFontFamily('Inter')).toBe('"Inter", sans-serif');
    expect(resolveFontFamily('Space Mono')).toBe('"Space Mono", sans-serif');
  });

  it('returns null for invalid or empty inputs', () => {
    expect(resolveFontFamily(undefined)).toBeNull();
    expect(resolveFontFamily(null)).toBeNull();
    expect(resolveFontFamily('')).toBeNull();
    expect(resolveFontFamily('   ')).toBeNull();
    // strings made only of disallowed characters should sanitize to null
    expect(resolveFontFamily(';;;')).toBeNull();
  });
});

describe('fonts.isPredefinedFontKey', () => {
  it('returns true for known FONT_MAP keys (case-insensitive)', () => {
    expect(isPredefinedFontKey('jetbrains')).toBe(true);
    expect(isPredefinedFontKey('JetBrains')).toBe(true);
    expect(isPredefinedFontKey('fira')).toBe(true);
    expect(isPredefinedFontKey('ROBOTO')).toBe(true);
  });

  it('returns false for custom or unknown fonts', () => {
    expect(isPredefinedFontKey('Inter')).toBe(false);
    expect(isPredefinedFontKey('Space Mono')).toBe(false);
  });

  it('returns false for null/undefined/empty', () => {
    expect(isPredefinedFontKey(undefined)).toBe(false);
    expect(isPredefinedFontKey(null)).toBe(false);
    expect(isPredefinedFontKey('')).toBe(false);
  });
});

describe('DEFAULT_FONTS_BASE64 — structural sanity', () => {
  it('is a non-empty string of substantial length', () => {
    expect(typeof DEFAULT_FONTS_BASE64).toBe('string');
    expect(DEFAULT_FONTS_BASE64.length).toBeGreaterThan(1000);
  });

  it('contains valid @font-face declarations for the app fonts (Syncopate + Space Grotesk)', () => {
    expect(DEFAULT_FONTS_BASE64).toContain('@font-face');
    expect(DEFAULT_FONTS_BASE64).toContain("font-family: 'Space Grotesk'");
    expect(DEFAULT_FONTS_BASE64).toContain("font-family: 'Syncopate'");
  });

  it('contains base64-encoded woff2 font data', () => {
    expect(DEFAULT_FONTS_BASE64).toMatch(/data:font\/woff2;base64,[A-Za-z0-9+/=]+/);
  });

  it('has balanced/well-formed CSS braces (no truncated @font-face blocks)', () => {
    const openBraces = (DEFAULT_FONTS_BASE64.match(/{/g) || []).length;
    const closeBraces = (DEFAULT_FONTS_BASE64.match(/}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
    expect(openBraces).toBeGreaterThan(0);
  });
});

describe('Zero external font request invariant for default SVGs', () => {
  it('generateSVG embeds real @font-face CSS and zero Google Fonts @import for default fonts', () => {
    const mockStats: StreakStats = {
      currentStreak: 5,
      longestStreak: 10,
      totalContributions: 100,
      todayDate: '2024-06-12',
    };
    const mockCalendar: ContributionCalendar = {
      totalContributions: 10,
      weeks: [{ contributionDays: [{ contributionCount: 5, date: '2024-06-12' }] }],
    };

    const mockParams = {
      user: 'testuser',
      speed: '8s',
      scale: 'linear',
    } as unknown as BadgeParams;

    const svg = generateSVG(mockStats, mockParams, mockCalendar);

    expect(svg).toContain('@font-face');
    expect(svg).toContain("font-family: 'Syncopate'");
    expect(svg).toContain("font-family: 'Space Grotesk'");
    expect(svg).not.toContain('@import url');
    expect(svg).not.toContain('fonts.googleapis.com');
  });
});
