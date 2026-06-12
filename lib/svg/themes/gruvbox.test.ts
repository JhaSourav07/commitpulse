import { describe, it, expect } from 'vitest';
import { themes } from '../themes';

describe('gruvbox theme', () => {
  const gruvbox = themes.gruvbox;

  it('exists in the themes collection', () => {
    expect(gruvbox).toBeDefined();
    expect(themes).toHaveProperty('gruvbox');
  });

  it('contains valid hexadecimal color values', () => {
    const hexRegex = /^[0-9A-Fa-f]{6}$/;

    expect(gruvbox.bg).toMatch(hexRegex);
    expect(gruvbox.text).toMatch(hexRegex);
    expect(gruvbox.accent).toMatch(hexRegex);

    if (gruvbox.negative) {
      expect(gruvbox.negative).toMatch(hexRegex);
    }
  });

  it('uses the expected gruvbox theme colors', () => {
    expect(gruvbox.bg).toBe('282828');
    expect(gruvbox.text).toBe('ebdbb2');
    expect(gruvbox.accent).toBe('fe8019');
    expect(gruvbox.negative).toBe('fb4934');
  });

  it('contains all required theme properties', () => {
    expect(gruvbox).toHaveProperty('bg');
    expect(gruvbox).toHaveProperty('text');
    expect(gruvbox).toHaveProperty('accent');
    expect(gruvbox).toHaveProperty('negative');
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

    const bgLum = luminance(gruvbox.bg);
    const textLum = luminance(gruvbox.text);

    const contrast = (Math.max(bgLum, textLum) + 0.05) / (Math.min(bgLum, textLum) + 0.05);

    expect(contrast).toBeGreaterThan(4.5);
  });
});
