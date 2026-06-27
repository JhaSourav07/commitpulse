import { describe, it, expect } from 'vitest';
import { themes } from './themes';
import { contrastRatio, relativeLuminance, hexToRgb } from './themes/test-utils';

describe('solarized_light theme color variables and configuration', () => {
  const theme = themes.solarized_light;

  it('has all required theme properties', () => {
    expect(theme).toBeDefined();
    expect(theme).toHaveProperty('bg');
    expect(theme).toHaveProperty('text');
    expect(theme).toHaveProperty('accent');
  });

  it('has correct base03 background hex value', () => {
    expect(theme.bg).toBe('fdf6e3');
    expect(theme.bg.length).toBe(6);
  });

  it('has correct base01 text hex value', () => {
    expect(theme.text).toBe('586e75');
    expect(theme.text.length).toBe(6);
  });

  it('has correct blue accent hex value', () => {
    expect(theme.accent).toBe('268bd2');
    expect(theme.accent.length).toBe(6);
  });

  it('has correct red negative hex value', () => {
    expect(theme.negative).toBe('dc322f');
    expect(theme.negative?.length).toBe(6);
  });

  it('has a light background luminance (solarized light theme)', () => {
    const lum = relativeLuminance(theme.bg);
    expect(lum).toBeGreaterThan(0.8);
  });

  it('satisfies WCAG AA contrast ratio for text against background', () => {
    const ratio = contrastRatio(theme.bg, theme.text);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('satisfies WCAG AA contrast ratio for accent against background (large text)', () => {
    const ratio = contrastRatio(theme.bg, theme.accent);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it('has no color collision between background, text, and accent', () => {
    expect(theme.bg).not.toBe(theme.text);
    expect(theme.bg).not.toBe(theme.accent);
    expect(theme.text).not.toBe(theme.accent);
  });

  it('has valid hex colors that can be parsed as RGB', () => {
    expect(() => hexToRgb(theme.bg)).not.toThrow();
    expect(() => hexToRgb(theme.text)).not.toThrow();
    expect(() => hexToRgb(theme.accent)).not.toThrow();
    const negative = theme.negative;
    if (negative) {
      expect(() => hexToRgb(negative)).not.toThrow();
    }
  });
});
