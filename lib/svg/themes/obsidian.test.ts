import { describe, it, expect } from 'vitest';
import { themes } from '../themes';

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);

  const normalize = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
}

function contrastRatio(bg: string, text: string) {
  const l1 = luminance(bg);
  const l2 = luminance(text);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('obsidian theme', () => {
  const obsidian = themes.obsidian;

  it('exists in the themes collection', () => {
    expect(obsidian).toBeDefined();
  });

  it('contains valid hexadecimal color values', () => {
    const hexRegex = /^[0-9A-Fa-f]{6}$/;

    expect(obsidian.bg).toMatch(hexRegex);
    expect(obsidian.text).toMatch(hexRegex);
    expect(obsidian.accent).toMatch(hexRegex);
  });

  it('uses the expected obsidian theme colors', () => {
    expect(obsidian.bg).toBe('1a1a2e');
    expect(obsidian.text).toBe('e2e8f0');
    expect(obsidian.accent).toBe('f59e0b');
  });

  it('provides distinct theme colors suitable for SVG rendering', () => {
    expect(obsidian.bg).not.toBe(obsidian.text);
    expect(obsidian.bg).not.toBe(obsidian.accent);
    expect(obsidian.text).not.toBe(obsidian.accent);
  });

  it('maintains sufficient contrast between background and text', () => {
    const ratio = contrastRatio(obsidian.bg, obsidian.text);

    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
