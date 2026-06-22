import { describe, expect, it } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hexToHsl,
  hslToHex,
  getContrastRatio,
  getContrastRating,
  findAccessibleColor,
} from './color';

describe('hexToRgb', () => {
  it('parses a 6-digit hex with #', () => {
    expect(hexToRgb('#10b981')).toEqual({ r: 16, g: 185, b: 129 });
  });

  it('parses a 6-digit hex without #', () => {
    expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('returns null for invalid hex', () => {
    expect(hexToRgb('#xyz')).toBeNull();
    expect(hexToRgb('')).toBeNull();
    expect(hexToRgb('#12345')).toBeNull();
  });

  it('handles black and white', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe('rgbToHex', () => {
  it('converts RGB to hex with #', () => {
    expect(rgbToHex(16, 185, 129)).toBe('#10b981');
  });

  it('handles zero and max values', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('pads single-digit hex components', () => {
    expect(rgbToHex(0, 0, 1)).toBe('#000001');
    expect(rgbToHex(15, 15, 15)).toBe('#0f0f0f');
  });
});

describe('rgbToHsl', () => {
  it('converts red to hsl(0, 100, 50)', () => {
    const { h, s, l } = rgbToHsl(255, 0, 0);
    expect(h).toBe(0);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });

  it('converts green to hsl(120, 100, 50)', () => {
    const { h, s, l } = rgbToHsl(0, 255, 0);
    expect(h).toBe(120);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });

  it('converts blue to hsl(240, 100, 50)', () => {
    const { h, s, l } = rgbToHsl(0, 0, 255);
    expect(h).toBe(240);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });

  it('converts black to hsl with 0 lightness', () => {
    const { l } = rgbToHsl(0, 0, 0);
    expect(l).toBe(0);
  });

  it('converts white to hsl with 100 lightness', () => {
    const { s, l } = rgbToHsl(255, 255, 255);
    expect(l).toBe(100);
    expect(s).toBe(0);
  });
});

describe('hexToHsl', () => {
  it('converts a hex color to HSL', () => {
    const { s, l } = hexToHsl('#10b981');
    expect(s).toBeGreaterThan(60);
    expect(l).toBeGreaterThan(35);
  });

  it('handles invalid hex with fallback', () => {
    const result = hexToHsl('invalid');
    expect(result).toEqual({ h: 0, s: 0, l: 50 });
  });
});

describe('hslToHex', () => {
  it('converts HSL to hex for pure red', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000');
  });

  it('converts HSL to hex for pure green', () => {
    expect(hslToHex(120, 100, 50)).toBe('#00ff00');
  });

  it('converts HSL to hex for pure blue', () => {
    expect(hslToHex(240, 100, 50)).toBe('#0000ff');
  });

  it('converts white', () => {
    expect(hslToHex(0, 0, 100)).toBe('#ffffff');
  });

  it('converts black', () => {
    expect(hslToHex(0, 0, 0)).toBe('#000000');
  });

  it('roundtrips with hexToHsl for pure hues', () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000'];
    for (const hex of colors) {
      const hsl = hexToHsl(hex);
      expect(hslToHex(hsl.h, hsl.s, hsl.l)).toBe(hex);
    }
  });

  it('roundtrips with minimal drift for compound colors', () => {
    const colors = ['#10b981', '#ff6600', '#8b5cf6'];
    for (const hex of colors) {
      const hsl = hexToHsl(hex);
      const result = hslToHex(hsl.h, hsl.s, hsl.l);
      // Allow 1% per-channel drift from integer HSL rounding
      const orig = parseInt(hex.slice(1), 16);
      const res = parseInt(result.slice(1), 16);
      const drift = Math.abs(orig - res) / 0xffffff;
      expect(drift).toBeLessThan(0.01);
    }
  });
});

describe('getContrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('returns 1 for same color', () => {
    expect(getContrastRatio('#ff0000', '#ff0000')).toBeCloseTo(1, 0);
  });

  it('returns 0 for invalid input', () => {
    expect(getContrastRatio('invalid', '#ffffff')).toBe(0);
  });

  it('is symmetric', () => {
    const a = getContrastRatio('#10b981', '#ffffff');
    const b = getContrastRatio('#ffffff', '#10b981');
    expect(a).toBeCloseTo(b, 4);
  });
});

describe('getContrastRating', () => {
  it('returns AAA for ratio >= 7', () => {
    expect(getContrastRating(7)).toEqual({ label: 'AAA', level: 'pass' });
    expect(getContrastRating(21)).toEqual({ label: 'AAA', level: 'pass' });
  });

  it('returns AA for ratio >= 4.5', () => {
    expect(getContrastRating(4.5)).toEqual({ label: 'AA', level: 'pass' });
    expect(getContrastRating(6.9)).toEqual({ label: 'AA', level: 'pass' });
  });

  it('returns AA Large for ratio >= 3', () => {
    expect(getContrastRating(3)).toEqual({ label: 'AA Large', level: 'warn' });
    expect(getContrastRating(4.4)).toEqual({ label: 'AA Large', level: 'warn' });
  });

  it('returns Fail for ratio < 3', () => {
    expect(getContrastRating(1)).toEqual({ label: 'Fail', level: 'fail' });
    expect(getContrastRating(2.9)).toEqual({ label: 'Fail', level: 'fail' });
  });
});

describe('findAccessibleColor', () => {
  it('returns an accessible color with sufficient contrast on white', () => {
    const result = findAccessibleColor('#ff0000', 'white');
    const ratio = getContrastRatio(result, '#ffffff');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('returns an accessible color with sufficient contrast on black', () => {
    const result = findAccessibleColor('#ff0000', 'black');
    const ratio = getContrastRatio(result, '#000000');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('returns a different color when the original has poor contrast', () => {
    const result = findAccessibleColor('#ff6600', 'white');
    expect(result).not.toBe('#ff6600');
    expect(getContrastRatio(result, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });
});
