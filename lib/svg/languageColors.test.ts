import { describe, expect, it } from 'vitest';

import { LANGUAGE_COLORS } from './languageColors';

describe('LANGUAGE_COLORS', () => {
  it('contains the correct TypeScript color', () => {
    expect(LANGUAGE_COLORS.TypeScript).toBe('#3178c6');
  });

  it('contains the correct JavaScript color', () => {
    expect(LANGUAGE_COLORS.JavaScript).toBe('#f1e05a');
  });

  it('defines Python color', () => {
    expect(LANGUAGE_COLORS.Python).toBeDefined();
  });

  it('uses valid 6-digit hex colors for every language', () => {
    for (const color of Object.values(LANGUAGE_COLORS)) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('contains at least 20 languages', () => {
    expect(Object.keys(LANGUAGE_COLORS).length).toBeGreaterThanOrEqual(20);
  });

  it('does not contain empty language names', () => {
    for (const language of Object.keys(LANGUAGE_COLORS)) {
      expect(language.trim()).not.toBe('');
    }
  });
});
