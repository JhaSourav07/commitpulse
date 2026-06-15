import { describe, expect, it } from 'vitest';
import { SVG_WIDTH, SVG_HEIGHT, isFontKey } from './generatorConstants';
import { FONT_MAP } from './fonts';

describe('generatorConstants Empty & Missing Input Fallbacks', () => {
  it('isFontKey safely rejects empty string input', () => {
    expect(isFontKey('')).toBe(false);
  });

  it('isFontKey safely rejects whitespace-only values', () => {
    expect(isFontKey(' ')).toBe(false);
    expect(isFontKey('    ')).toBe(false);
    expect(isFontKey('\t')).toBe(false);
    expect(isFontKey('\n')).toBe(false);
  });

  it('isFontKey safely rejects undefined and null-like runtime values', () => {
    expect(isFontKey(undefined as unknown as string)).toBe(false);
    expect(isFontKey(null as unknown as string)).toBe(false);
  });

  it('isFontKey rejects malformed or unknown font identifiers', () => {
    expect(isFontKey('unknown-font')).toBe(false);
    expect(isFontKey('UNKNOWN-FONT')).toBe(false);
    expect(isFontKey('<script>alert(1)</script>')).toBe(false);
    expect(isFontKey('font-family:arial')).toBe(false);
  });

  it('exports stable fallback constants and a non-empty font map', () => {
    expect(SVG_WIDTH).toBeGreaterThan(0);
    expect(SVG_HEIGHT).toBeGreaterThan(0);

    expect(Number.isFinite(SVG_WIDTH)).toBe(true);
    expect(Number.isFinite(SVG_HEIGHT)).toBe(true);

    expect(Object.keys(FONT_MAP).length).toBeGreaterThan(0);
  });
});
