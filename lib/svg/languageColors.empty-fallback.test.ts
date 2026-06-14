import { describe, expect, it } from 'vitest';
import { LANGUAGE_COLORS } from './languageColors';

describe('LANGUAGE_COLORS Empty & Missing Input Fallbacks', () => {
  it('returns undefined for unknown language lookups without throwing', () => {
    expect(LANGUAGE_COLORS['UnknownLanguage']).toBeUndefined();
    expect(LANGUAGE_COLORS['NonExistentLanguage']).toBeUndefined();
  });

  it('returns undefined for empty-string language lookups', () => {
    expect(LANGUAGE_COLORS['']).toBeUndefined();
  });

  it('returns undefined for whitespace-only language lookups', () => {
    expect(LANGUAGE_COLORS[' ']).toBeUndefined();
    expect(LANGUAGE_COLORS['   ']).toBeUndefined();
    expect(LANGUAGE_COLORS['\t']).toBeUndefined();
  });

  it('handles null and undefined-like runtime access safely', () => {
    expect(LANGUAGE_COLORS[undefined as unknown as string]).toBeUndefined();

    expect(LANGUAGE_COLORS[null as unknown as string]).toBeUndefined();
  });

  it('maintains a valid fallback configuration object', () => {
    const entries = Object.entries(LANGUAGE_COLORS);

    expect(entries.length).toBeGreaterThan(0);

    entries.forEach(([language, color]) => {
      expect(language.trim().length).toBeGreaterThan(0);
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});
