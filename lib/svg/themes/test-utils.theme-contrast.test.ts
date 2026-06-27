import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb, relativeLuminance } from './test-utils';

const WCAG_AA_TEXT_CONTRAST = 4.5;

const themePairs = {
  dark: {
    background: '#0f172a',
    foreground: '#f8fafc',
    mutedForeground: '#cbd5e1',
    overlay: '#1e293b',
  },
  light: {
    background: '#ffffff',
    foreground: '#0f172a',
    mutedForeground: '#334155',
    overlay: '#f1f5f9',
  },
};

describe('test-utils theme contrast cohesion', () => {
  it('converts dark and light theme hex colors into rgb channels', () => {
    expect(hexToRgb(themePairs.dark.background)).toEqual({
      r: 15,
      g: 23,
      b: 42,
    });

    expect(hexToRgb(themePairs.light.foreground)).toEqual({
      r: 15,
      g: 23,
      b: 42,
    });
  });

  it('computes lower luminance for dark backgrounds than light backgrounds', () => {
    expect(relativeLuminance(themePairs.dark.background)).toBeLessThan(
      relativeLuminance(themePairs.light.background)
    );
  });

  it('keeps primary text readable in both dark and light theme presets', () => {
    expect(
      contrastRatio(themePairs.dark.background, themePairs.dark.foreground)
    ).toBeGreaterThanOrEqual(WCAG_AA_TEXT_CONTRAST);

    expect(
      contrastRatio(themePairs.light.background, themePairs.light.foreground)
    ).toBeGreaterThanOrEqual(WCAG_AA_TEXT_CONTRAST);
  });

  it('keeps muted text readable against background overlays', () => {
    expect(
      contrastRatio(themePairs.dark.overlay, themePairs.dark.mutedForeground)
    ).toBeGreaterThanOrEqual(WCAG_AA_TEXT_CONTRAST);

    expect(
      contrastRatio(themePairs.light.overlay, themePairs.light.mutedForeground)
    ).toBeGreaterThanOrEqual(WCAG_AA_TEXT_CONTRAST);
  });

  it('rejects invalid stylesheet color tokens before contrast checks run', () => {
    expect(() => contrastRatio('bg-slate-900', themePairs.dark.foreground)).toThrow(
      'Invalid hex color'
    );

    expect(() => hexToRgb('#fff')).toThrow('Invalid hex color');
  });
});
