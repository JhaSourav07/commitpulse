import { describe, expect, it } from 'vitest';

import { FONT_MAP, resolveFontFamily, isPredefinedFontKey } from './fonts';

describe('fonts Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('exports readable predefined font mappings', () => {
    expect(FONT_MAP.jetbrains).toContain('JetBrains Mono');

    expect(FONT_MAP.fira).toContain('Fira Code');

    expect(FONT_MAP.roboto).toContain('Roboto');
  });

  it('resolves predefined fonts accessibly', () => {
    expect(resolveFontFamily('jetbrains')).toBe('"JetBrains Mono", monospace');

    expect(resolveFontFamily('spacegrotesk')).toBe('"Space Grotesk", sans-serif');
  });

  it('resolves custom fonts into readable font-family strings', () => {
    expect(resolveFontFamily('Inter')).toBe('"Inter", sans-serif');
  });

  it('detects predefined font keys correctly', () => {
    expect(isPredefinedFontKey('jetbrains')).toBe(true);

    expect(isPredefinedFontKey('space grotesk')).toBe(true);

    expect(isPredefinedFontKey('inter')).toBe(false);
  });

  it('returns null or false for invalid accessibility inputs', () => {
    expect(resolveFontFamily(undefined)).toBeNull();

    expect(resolveFontFamily('')).toBeNull();

    expect(isPredefinedFontKey(undefined)).toBe(false);
  });
});
