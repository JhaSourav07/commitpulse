import { describe, expect, it } from 'vitest';

import { FONT_MAP, resolveFont, isPredefinedFontKey } from './fonts';

describe('fonts Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('exports readable predefined font mappings', () => {
    expect(FONT_MAP.jetbrains).toContain('JetBrains Mono');

    expect(FONT_MAP.fira).toContain('Fira Code');

    expect(FONT_MAP.roboto).toContain('Roboto');
  });

  it('resolves predefined fonts accessibly', () => {
    expect(resolveFont('jetbrains')).toBe('"JetBrains Mono", monospace');

    expect(resolveFont('spacegrotesk')).toBe('"Space Grotesk", sans-serif');
  });

  it('resolves custom fonts into readable font-family strings', () => {
    expect(resolveFont('Inter')).toBe('"Inter", sans-serif');
  });

  it('detects predefined font keys correctly', () => {
    expect(isPredefinedFontKey('jetbrains')).toBe(true);

    expect(isPredefinedFontKey('space grotesk')).toBe(true);

    expect(isPredefinedFontKey('inter')).toBe(false);
  });

  it('returns null or false for invalid accessibility inputs', () => {
    expect(resolveFont(undefined)).toBeNull();

    expect(resolveFont('')).toBeNull();

    expect(isPredefinedFontKey(undefined)).toBe(false);
  });
});
