import { describe, it, expect } from 'vitest';
import FONT_MAP, { resolveFontFamily, isPredefinedFontKey } from './fonts';

describe('fonts empty and missing inputs', () => {
  it('resolveFontFamily returns null for undefined input without throwing', () => {
    expect(resolveFontFamily(undefined)).toBeNull();
  });

  it('resolveFontFamily returns null for null input without throwing', () => {
    expect(resolveFontFamily(null)).toBeNull();
  });

  it('resolveFontFamily returns null for whitespace-only string', () => {
    expect(resolveFontFamily('   ')).toBeNull();
    expect(resolveFontFamily('\t')).toBeNull();
    expect(resolveFontFamily('\n')).toBeNull();
  });

  it('isPredefinedFontKey returns false for empty or missing inputs without throwing', () => {
    expect(isPredefinedFontKey(undefined)).toBe(false);
    expect(isPredefinedFontKey(null)).toBe(false);
    expect(isPredefinedFontKey('')).toBe(false);
    expect(isPredefinedFontKey('   ')).toBe(false);
  });

  it('FONT_MAP default export is a non-empty object', () => {
    expect(FONT_MAP).toBeDefined();
    expect(typeof FONT_MAP).toBe('object');
    expect(Object.keys(FONT_MAP).length).toBeGreaterThan(0);
    expect(FONT_MAP.jetbrains).toBeDefined();
    expect(FONT_MAP.fira).toBeDefined();
    expect(FONT_MAP.roboto).toBeDefined();
  });
});
