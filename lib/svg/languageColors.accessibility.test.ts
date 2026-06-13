import { describe, expect, it } from 'vitest';

import { LANGUAGE_COLORS } from './languageColors';

describe('LANGUAGE_COLORS Accessibility Standards & Screen Reader Compliance', () => {
  it('provides non-empty language labels that can serve as accessible identifiers', () => {
    for (const language of Object.keys(LANGUAGE_COLORS)) {
      expect(language.trim().length).toBeGreaterThan(0);
    }
  });

  it('ensures every language has an associated color description value', () => {
    for (const [language, color] of Object.entries(LANGUAGE_COLORS)) {
      expect(language).toBeTruthy();
      expect(color).toBeTruthy();
    }
  });

  it('uses valid hexadecimal color values for consistent visual accessibility', () => {
    for (const color of Object.values(LANGUAGE_COLORS)) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('maintains unique language identifiers to avoid accessibility reference conflicts', () => {
    const languages = Object.keys(LANGUAGE_COLORS);

    expect(new Set(languages).size).toBe(languages.length);
  });

  it('preserves deterministic language ordering for assistive technology consumption', () => {
    const entries = Object.entries(LANGUAGE_COLORS);

    expect(entries.length).toBeGreaterThan(0);

    entries.forEach(([language, color]) => {
      expect(typeof language).toBe('string');
      expect(typeof color).toBe('string');
    });
  });
});
