import { describe, it, expect } from 'vitest';
import { themes } from '../themes';

describe('ocean theme', () => {
  const ocean = themes.ocean;

  it('exists in the themes collection', () => {
    expect(ocean).toBeDefined();
    expect(themes).toHaveProperty('ocean');
  });

  it('contains valid hexadecimal color values', () => {
    const hexRegex = /^[0-9A-Fa-f]{6}$/;

    expect(ocean.bg).toMatch(hexRegex);
    expect(ocean.text).toMatch(hexRegex);
    expect(ocean.accent).toMatch(hexRegex);

    if (ocean.negative) {
      expect(ocean.negative).toMatch(hexRegex);
    }
  });

  it('uses the expected ocean theme colors', () => {
    expect(ocean.bg).toBe('0a192f');
    expect(ocean.text).toBe('ccd6f6');
    expect(ocean.accent).toBe('64ffda');
    expect(ocean.negative).toBe('ff6b6b');
  });

  it('renders a dummy svg containing ocean theme colors', () => {
    const svg = `
      <svg width="100" height="100">
        <rect fill="${ocean.bg}" />
        <text fill="${ocean.text}">Ocean</text>
        <circle fill="${ocean.accent}" />
      </svg>
    `;

    expect(svg).toContain(ocean.bg);
    expect(svg).toContain(ocean.text);
    expect(svg).toContain(ocean.accent);
  });

  it('provides sufficient contrast between background and text', () => {
    const luminance = (hex: string) => {
      const rgb = hex
        .match(/.{2}/g)!
        .map((v) => parseInt(v, 16) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));

      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };

    const bgLum = luminance(ocean.bg);
    const textLum = luminance(ocean.text);

    const contrast = (Math.max(bgLum, textLum) + 0.05) / (Math.min(bgLum, textLum) + 0.05);

    expect(contrast).toBeGreaterThan(4.5);
  });
});
