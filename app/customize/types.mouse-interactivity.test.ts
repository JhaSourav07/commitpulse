import { describe, expect, it } from 'vitest';

import {
  DELTA_FORMATS,
  FONTS,
  LANGUAGES,
  SIZES,
  SPEEDS,
  THEME_KEYS,
  TIMEZONES,
  VIEW_MODES,
} from './types';

function getValues<T extends readonly { value: string; label: string }[]>(items: T) {
  return items.map((item) => item.value);
}

describe('CustomizeTypes mouse interactivity metadata (Variation 5)', () => {
  it('exposes theme options used by interactive theme controls', () => {
    expect(THEME_KEYS).toContain('auto');
    expect(THEME_KEYS).toContain('random');
    expect(THEME_KEYS.length).toBeGreaterThan(2);
  });

  it('keeps speed options label-rich for hoverable/selectable controls', () => {
    SPEEDS.forEach((speed) => {
      expect(speed.value).toMatch(/s$/);
      expect(speed.label.length).toBeGreaterThan(0);
    });
  });

  it('keeps size options stable for pointer-driven selection controls', () => {
    expect(getValues(SIZES)).toEqual(['small', 'medium', 'large']);

    SIZES.forEach((size) => {
      expect(size.label).toBeTruthy();
    });
  });

  it('keeps customize option groups free from duplicate selectable values', () => {
    const optionGroups = [FONTS, VIEW_MODES, DELTA_FORMATS, LANGUAGES, TIMEZONES];

    optionGroups.forEach((group) => {
      const values = getValues(group);
      expect(new Set(values).size).toBe(values.length);
    });
  });

  it('provides timezone labels for touch and select interaction menus', () => {
    expect(getValues(TIMEZONES)).toContain('UTC');
    expect(getValues(TIMEZONES)).toContain('Asia/Kolkata');

    TIMEZONES.forEach((timezone) => {
      expect(timezone.label).toBeTruthy();
    });
  });
});
