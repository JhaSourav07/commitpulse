import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import {
  THEME_KEYS,
  SPEEDS,
  SIZES,
  FONTS,
  VIEW_MODES,
  DELTA_FORMATS,
  LANGUAGES,
  TIMEZONES,
} from './types';

const setViewport = (width: number, height = 844) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  window.dispatchEvent(new Event('resize'));
};

describe('CustomizeTypes Responsive Breakpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    setViewport(1024, 768);
  });

  it('preserves exported configuration on a standard mobile viewport (375px)', () => {
    setViewport(375);

    expect(window.innerWidth).toBe(375);

    expect(THEME_KEYS.length).toBeGreaterThan(2);
    expect(SPEEDS.length).toBeGreaterThan(0);
    expect(SIZES.length).toBeGreaterThan(0);
    expect(FONTS.length).toBeGreaterThan(0);
    expect(VIEW_MODES.length).toBeGreaterThan(0);
    expect(DELTA_FORMATS.length).toBeGreaterThan(0);
    expect(LANGUAGES.length).toBeGreaterThan(0);
    expect(TIMEZONES.length).toBeGreaterThan(0);
  });

  it('keeps theme ordering identical across viewport sizes', () => {
    setViewport(375);
    const mobileThemes = [...THEME_KEYS];

    setViewport(768);
    const tabletThemes = [...THEME_KEYS];

    setViewport(1440);
    const desktopThemes = [...THEME_KEYS];

    expect(mobileThemes).toEqual(tabletThemes);
    expect(tabletThemes).toEqual(desktopThemes);
  });

  it('does not mutate exported option collections during resize events', () => {
    const initial = {
      speeds: [...SPEEDS],
      sizes: [...SIZES],
      fonts: [...FONTS],
      views: [...VIEW_MODES],
      deltas: [...DELTA_FORMATS],
      languages: [...LANGUAGES],
      timezones: [...TIMEZONES],
    };

    [320, 375, 414, 768, 1024, 1440].forEach((width) => {
      setViewport(width);
    });

    expect(SPEEDS).toEqual(initial.speeds);
    expect(SIZES).toEqual(initial.sizes);
    expect(FONTS).toEqual(initial.fonts);
    expect(VIEW_MODES).toEqual(initial.views);
    expect(DELTA_FORMATS).toEqual(initial.deltas);
    expect(LANGUAGES).toEqual(initial.languages);
    expect(TIMEZONES).toEqual(initial.timezones);
  });

  it('contains no duplicate values that could break responsive controls', () => {
    const unique = <T extends { value: string }>(items: readonly T[]) =>
      new Set(items.map((item) => item.value)).size;

    expect(unique(SPEEDS)).toBe(SPEEDS.length);
    expect(unique(SIZES)).toBe(SIZES.length);
    expect(unique(FONTS)).toBe(FONTS.length);
    expect(unique(VIEW_MODES)).toBe(VIEW_MODES.length);
    expect(unique(DELTA_FORMATS)).toBe(DELTA_FORMATS.length);
    expect(unique(LANGUAGES)).toBe(LANGUAGES.length);
    expect(unique(TIMEZONES)).toBe(TIMEZONES.length);
  });

  it('exports valid configuration for mobile and desktop layouts', () => {
    [320, 375, 390, 414, 768, 1024, 1280].forEach((width) => {
      setViewport(width);

      expect(window.innerWidth).toBe(width);

      expect(THEME_KEYS[0]).toBe('auto');
      expect(THEME_KEYS.at(-1)).toBe('random');

      expect(SPEEDS.every((x) => x.value && x.label)).toBe(true);
      expect(SIZES.every((x) => x.value && x.label)).toBe(true);
      expect(FONTS.every((x) => x.value && x.label)).toBe(true);
      expect(VIEW_MODES.every((x) => x.value && x.label)).toBe(true);
      expect(DELTA_FORMATS.every((x) => x.value && x.label)).toBe(true);
      expect(LANGUAGES.every((x) => x.value && x.label)).toBe(true);
      expect(TIMEZONES.every((x) => x.value && x.label)).toBe(true);
    });
  });
});
