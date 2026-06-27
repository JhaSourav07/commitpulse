import { describe, it, expect } from 'vitest';
import { themes } from '../themes';

describe('sunset theme', () => {
  const sunset = themes.sunset;

  it('exists in the themes collection', () => {
    expect(sunset).toBeDefined();
    expect(themes).toHaveProperty('sunset');
  });

  it('contains valid hexadecimal color values', () => {
    const hexRegex = /^[0-9A-Fa-f]{6}$/;

    expect(sunset.bg).toMatch(hexRegex);
    expect(sunset.text).toMatch(hexRegex);
    expect(sunset.accent).toMatch(hexRegex);

    if (sunset.negative) {
      expect(sunset.negative).toMatch(hexRegex);
    }
  });

  it('uses the expected sunset theme colors', () => {
    expect(sunset.bg).toBe('1a0a0a');
    expect(sunset.text).toBe('ffd6c0');
    expect(sunset.accent).toBe('ff6b35');
    expect(sunset.negative).toBe('ff4d4d');
  });

  it('provides sufficient contrast between background and text', () => {
    const luminance = (hex: string) => {
      const rgb = hex
        .replace('#', '')
        .match(/.{2}/g)!
        .map((v) => parseInt(v, 16) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));

      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };

    const bgLum = luminance(sunset.bg);
    const textLum = luminance(sunset.text);

    const contrast = (Math.max(bgLum, textLum) + 0.05) / (Math.min(bgLum, textLum) + 0.05);

    expect(contrast).toBeGreaterThan(4.5);
  });
  it('contains all required theme properties', () => {
    expect(sunset).toHaveProperty('bg');
    expect(sunset).toHaveProperty('text');
    expect(sunset).toHaveProperty('accent');
    expect(sunset).toHaveProperty('negative');
  });
});
