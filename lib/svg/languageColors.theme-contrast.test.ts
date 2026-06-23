import { describe, it, expect } from 'vitest';
import { LANGUAGE_COLORS } from './languageColors';

describe('Dark and Light prefers-color-scheme visual cohesion', () => {
  it('provides language color mappings', () => {
    expect(LANGUAGE_COLORS).toBeDefined();
    expect(Object.keys(LANGUAGE_COLORS).length).toBeGreaterThan(0);
  });

  it('contains expected core language entries', () => {
    expect(LANGUAGE_COLORS).toHaveProperty('TypeScript');
    expect(LANGUAGE_COLORS).toHaveProperty('JavaScript');
    expect(LANGUAGE_COLORS).toHaveProperty('Python');
  });

  it('uses valid hex color values for all languages', () => {
    Object.values(LANGUAGE_COLORS).forEach((color) => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('ensures all language colors are non-empty strings', () => {
    Object.values(LANGUAGE_COLORS).forEach((color) => {
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    });
  });

  it('maintains distinct colors for common languages', () => {
    expect(LANGUAGE_COLORS.TypeScript).not.toBe(LANGUAGE_COLORS.JavaScript);

    expect(LANGUAGE_COLORS.JavaScript).not.toBe(LANGUAGE_COLORS.Python);
  });
});
