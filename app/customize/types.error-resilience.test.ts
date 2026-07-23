import { describe, it, expect } from 'vitest';
import {
  THEME_KEYS,
  TIMEZONES,
  SPEEDS,
  SIZES,
  FONTS,
  VIEW_MODES,
  DELTA_FORMATS,
  LANGUAGES,
} from './types';
import { themes } from '../../lib/svg/themes';

describe('Customize Types - Error Resilience', () => {
  it('should always expose valid theme keys with auto/random fallbacks', () => {
    expect(THEME_KEYS[0]).toBe('auto');
    expect(THEME_KEYS.at(-1)).toBe('random');

    const expected = ['auto', ...Object.keys(themes), 'random'];

    expect([...THEME_KEYS].sort()).toEqual(expected.sort());
  });

  it('should preserve stable exported configuration collections', () => {
    expect(SPEEDS.length).toBeGreaterThan(0);
    expect(SIZES.length).toBeGreaterThan(0);
    expect(FONTS.length).toBeGreaterThan(0);
    expect(VIEW_MODES.length).toBeGreaterThan(0);
    expect(DELTA_FORMATS.length).toBeGreaterThan(0);
    expect(LANGUAGES.length).toBeGreaterThan(0);
    expect(TIMEZONES.length).toBeGreaterThan(0);
  });

  it('should expose unique timezone identifiers', () => {
    const values = TIMEZONES.map((tz) => tz.value);

    expect(new Set(values).size).toBe(values.length);
    expect(values).toContain('UTC');
  });

  it('should expose configuration entries with valid value and label properties', () => {
    const collections = [SPEEDS, SIZES, FONTS, VIEW_MODES, DELTA_FORMATS, LANGUAGES, TIMEZONES];

    collections.forEach((collection) => {
      collection.forEach((item) => {
        expect(item.value).toBeTruthy();
        expect(item.label).toBeTruthy();
      });
    });
  });

  it('should remain deterministic across repeated accesses', () => {
    expect([...THEME_KEYS]).toEqual([...THEME_KEYS]);
    expect([...TIMEZONES]).toEqual([...TIMEZONES]);
    expect([...VIEW_MODES]).toEqual([...VIEW_MODES]);
  });
});
