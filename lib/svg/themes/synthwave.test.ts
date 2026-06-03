import { describe, it, expect } from 'vitest';
import { themes } from '../themes';

describe('synthwave theme', () => {
  const synthwave = themes.synthwave;

  it('exists in the themes collection', () => {
    expect(synthwave).toBeDefined();
    expect(themes).toHaveProperty('synthwave');
  });

  it('contains valid hexadecimal color values', () => {
    const hexRegex = /^[0-9A-Fa-f]{6}$/;

    expect(synthwave.bg).toMatch(hexRegex);
    expect(synthwave.text).toMatch(hexRegex);
    expect(synthwave.accent).toMatch(hexRegex);

    if (synthwave.negative) {
      expect(synthwave.negative).toMatch(hexRegex);
    }
  });

  it('uses the expected synthwave theme colors', () => {
    expect(synthwave.bg).toBe('0d0221');
    expect(synthwave.text).toBe('f8f8f2');
    expect(synthwave.accent).toBe('ff2d78');
    expect(synthwave.negative).toBe('ff3864');
  });

  it('contains all required theme properties', () => {
    expect(synthwave).toHaveProperty('bg');
    expect(synthwave).toHaveProperty('text');
    expect(synthwave).toHaveProperty('accent');
    expect(synthwave).toHaveProperty('negative');
  });

  it('provides sufficient contrast between background and text', () => {
    const luminance = (hex: string) => {
      const rgb = hex
        .match(/.{2}/g)!
        .map((v) => parseInt(v, 16) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));

      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };

    const bgLum = luminance(synthwave.bg);
    const textLum = luminance(synthwave.text);

    const contrast = (Math.max(bgLum, textLum) + 0.05) / (Math.min(bgLum, textLum) + 0.05);

    expect(contrast).toBeGreaterThan(4.5);
  });
});
