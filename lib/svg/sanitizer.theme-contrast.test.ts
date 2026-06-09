import { describe, it, expect } from 'vitest';
import {
  isValidHex,
  hexColor,
  sanitizeHexColor,
  getLuminance,
  normalizeHexColor,
} from './sanitizer';
import { contrastRatio } from './themes/test-utils';

const darkColors = ['0d1117', '000000', '1a1a2e', '282828', '0a0a0a'];
const lightColors = ['ffffff', 'fbf1c7', 'eff1f5', 'fdf6e3', 'eceff4'];

describe('Sanitizer dark and light color cohesion', () => {
  it.each([...darkColors.map((c) => [c] as const), ...lightColors.map((c) => [c] as const)])(
    'accepts %s as a valid hex color',
    (color) => {
      expect(isValidHex(color)).toBe(true);
    }
  );

  it('computes distinctly different luminance between dark and light backgrounds', () => {
    const darkLums = darkColors.map(getLuminance);
    const lightLums = lightColors.map(getLuminance);
    expect(Math.max(...darkLums)).toBeLessThan(Math.min(...lightLums));
  });

  it('produces WCAG AA contrast (≥ 4.5, normal text) for sampled dark-on-light pairs', () => {
    const pairs = [
      { bg: 'ffffff', text: '0d1117' },
      { bg: 'fbf1c7', text: '3c3836' },
      { bg: 'eff1f5', text: '4c4f69' },
    ];
    for (const { bg, text } of pairs) {
      const ratio = contrastRatio(bg, text);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each([...darkColors.map((c) => [c] as const), ...lightColors.map((c) => [c] as const)])(
    'normalizes %s without altering the value',
    (color) => {
      expect(normalizeHexColor(color)).toBe(color);
    }
  );

  it.each([...darkColors.map((c) => [c] as const), ...lightColors.map((c) => [c] as const)])(
    'passes %s through hexColor and sanitizeHexColor unchanged',
    (color) => {
      expect(hexColor(color)).toBe(color);
      expect(sanitizeHexColor(color, '000000')).toBe(color);
    }
  );
});
