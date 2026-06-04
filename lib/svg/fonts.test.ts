import { describe, it, expect } from 'vitest';
import FONT_MAP, { resolveFont } from './fonts';

describe('fonts.resolveFont', () => {
  it('returns predefined stack for known keys (case-insensitive)', () => {
    expect(resolveFont('jetbrains')).toBe(FONT_MAP.jetbrains);
    expect(resolveFont('JetBrains')).toBe(FONT_MAP.jetbrains);
    expect(resolveFont('FIRA')).toBe(FONT_MAP.fira);
  });

  it('returns a dynamic font-family for custom font names', () => {
    expect(resolveFont('Inter')).toBe('"Inter", sans-serif');
    expect(resolveFont('Space Mono')).toBe('"Space Mono", sans-serif');
  });

  it('returns null for invalid or empty inputs', () => {
    expect(resolveFont(undefined)).toBeNull();
    expect(resolveFont(null)).toBeNull();
    expect(resolveFont('')).toBeNull();
    expect(resolveFont('   ')).toBeNull();
    // strings made only of disallowed characters should sanitize to null
    expect(resolveFont(';;;')).toBeNull();
  });
});
