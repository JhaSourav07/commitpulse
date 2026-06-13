import { describe, expect, it } from 'vitest';
import { themes } from '@/lib/svg/themes';

function contrastRatio(bg: string, text: string): number {
  const hexToRgb = (hex: string) => {
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
    const convert = (v: number) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * convert(r) + 0.7152 * convert(g) + 0.0722 * convert(b);
  };

  const l1 = luminance(hexToRgb(bg));
  const l2 = luminance(hexToRgb(text));

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('PNG Route Theme Contrast', () => {
  it('dark theme should have different bg and text colors', () => {
    expect(themes.dark.bg).not.toBe(themes.dark.text);
  });

  it('light theme should have different bg and text colors', () => {
    expect(themes.light.bg).not.toBe(themes.light.text);
  });

  it('dark theme should meet WCAG contrast ratio', () => {
    expect(contrastRatio(themes.dark.bg, themes.dark.text)).toBeGreaterThanOrEqual(4.5);
  });

  it('light theme should meet WCAG contrast ratio', () => {
    expect(contrastRatio(themes.light.bg, themes.light.text)).toBeGreaterThanOrEqual(4.5);
  });

  it('all themes should define bg text and accent', () => {
    Object.values(themes).forEach((theme) => {
      expect(theme.bg).toBeDefined();
      expect(theme.text).toBeDefined();
      expect(theme.accent).toBeDefined();
    });
  });
});
