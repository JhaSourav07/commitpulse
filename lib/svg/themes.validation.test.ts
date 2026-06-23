import { describe, it, expect } from 'vitest';
import { themes, validateThemes, badgeThemeSchema } from './themes';

describe('theme validation', () => {
  it('default themes map is valid', () => {
    // Should not throw
    expect(() => validateThemes(themes)).not.toThrow();
  });

  it('badgeThemeSchema successfully validates correct themes', () => {
    const validTheme = {
      bg: '0d1117',
      text: 'ffffff',
      accent: '58a6ff',
      negative: 'f85149',
    };
    expect(badgeThemeSchema.safeParse(validTheme).success).toBe(true);
  });

  it('badgeThemeSchema rejects themes with missing required fields', () => {
    const invalidTheme = {
      bg: '0d1117',
      text: 'ffffff',
      // accent is missing
    };
    expect(badgeThemeSchema.safeParse(invalidTheme).success).toBe(false);
  });

  it('badgeThemeSchema rejects themes with invalid hex color formats', () => {
    const invalidTheme = {
      bg: '0d1117',
      text: 'invalid-hex',
      accent: '58a6ff',
    };
    expect(badgeThemeSchema.safeParse(invalidTheme).success).toBe(false);
  });

  it('validateThemes throws descriptive error on invalid theme entry', () => {
    const mockThemes = {
      valid: {
        bg: '0d1117',
        text: 'ffffff',
        accent: '58a6ff',
      },
      badTheme: {
        bg: '0d1117',
        text: 'ffffff',
        // accent is missing
      },
    };
    expect(() => validateThemes(mockThemes)).toThrow('Theme validation failed for "badTheme"');
  });
});
