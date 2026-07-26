import { describe, it, expect } from 'vitest';
import FONT_MAP, { resolveFontFamily } from './fonts';

describe('fonts.resolveFontFamily', () => {
  it('returns predefined stack for known keys (case-insensitive)', () => {
    expect(resolveFontFamily('jetbrains')).toBe(FONT_MAP.jetbrains);
    expect(resolveFontFamily('JetBrains')).toBe(FONT_MAP.jetbrains);
    expect(resolveFontFamily('FIRA')).toBe(FONT_MAP.fira);
  });

  it('returns a dynamic font-family for custom font names', () => {
    expect(resolveFontFamily('Inter')).toBe('"Inter", sans-serif');
    expect(resolveFontFamily('Space Mono')).toBe('"Space Mono", sans-serif');
  });

  it('returns null for invalid or empty inputs', () => {
    expect(resolveFontFamily(undefined)).toBeNull();
    expect(resolveFontFamily(null)).toBeNull();
    expect(resolveFontFamily('')).toBeNull();
    expect(resolveFontFamily('   ')).toBeNull();
    // strings made only of disallowed characters should sanitize to null
    expect(resolveFontFamily(';;;')).toBeNull();
  });
});

import { isPredefinedFontKey } from './fonts';

describe('fonts.isPredefinedFontKey', () => {
  it('returns true for known FONT_MAP keys (case-insensitive)', () => {
    expect(isPredefinedFontKey('jetbrains')).toBe(true);
    expect(isPredefinedFontKey('JetBrains')).toBe(true);
    expect(isPredefinedFontKey('fira')).toBe(true);
    expect(isPredefinedFontKey('ROBOTO')).toBe(true);
  });

  it('returns false for custom or unknown fonts', () => {
    expect(isPredefinedFontKey('Inter')).toBe(false);
    expect(isPredefinedFontKey('Space Mono')).toBe(false);
  });

  it('returns false for null/undefined/empty', () => {
    expect(isPredefinedFontKey(undefined)).toBe(false);
    expect(isPredefinedFontKey(null)).toBe(false);
    expect(isPredefinedFontKey('')).toBe(false);
  });
});
