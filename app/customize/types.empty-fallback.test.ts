import { describe, it, expect } from 'vitest';
import {
  THEME_KEYS,
  SPEEDS,
  SIZES,
  FONTS,
  VIEW_MODES,
  DELTA_FORMATS,
  LANGUAGES,
  TIMEZONES,
  type CustomizeOptions,
  type ThemeOption,
  type ViewMode,
  type DeltaFormat,
  type Language,
  type Timezone,
} from './types';

// ---------------------------------------------------------------------------
// Edge Cases & Empty/Missing Inputs Verification
//
// These tests guard against production instability when configuration arrays
// are empty, when optional fields are absent, or when code paths receive
// the boundary / zero-value inputs that real users occasionally trigger
// (e.g. empty username, missing theme selection, zero-length option lists).
// ---------------------------------------------------------------------------

describe('CustomizeTypes – Edge Cases & Empty/Missing Inputs Verification', () => {
  // -------------------------------------------------------------------------
  // Test 1 — All exported option arrays are non-empty
  //
  // If any array is accidentally wiped (e.g. after a bad merge), downstream
  // <select> elements would render with no options, silently breaking the UI.
  // Each array must contain at least one entry so selects always have a fallback.
  // -------------------------------------------------------------------------
  it('every option array (SPEEDS, SIZES, FONTS, VIEW_MODES, DELTA_FORMATS, LANGUAGES, TIMEZONES) is non-empty', () => {
    const collections = [SPEEDS, SIZES, FONTS, VIEW_MODES, DELTA_FORMATS, LANGUAGES, TIMEZONES];

    for (const collection of collections) {
      // Cast required because each array is a narrowly-typed readonly tuple
      expect((collection as readonly { value: string; label: string }[]).length).toBeGreaterThan(0);
    }

    // THEME_KEYS is separately derived from the themes record; it must include
    // at least the two virtual entries ('auto' and 'random') plus one real theme.
    expect(THEME_KEYS.length).toBeGreaterThanOrEqual(3);
  });

  // -------------------------------------------------------------------------
  // Test 2 — Every option entry has non-empty value and label strings
  //
  // An empty string for `value` would result in a blank query parameter being
  // sent to the API. An empty `label` renders a blank option in the UI.
  // Both are unacceptable — validate that every entry in every collection
  // carries a meaningful, non-whitespace string for both fields.
  // -------------------------------------------------------------------------
  it('every entry in all option arrays has a non-empty value and a non-empty label', () => {
    const collections: readonly (readonly { value: string; label: string }[])[] = [
      SPEEDS,
      SIZES,
      FONTS,
      VIEW_MODES,
      DELTA_FORMATS,
      LANGUAGES,
      TIMEZONES,
    ];

    for (const collection of collections) {
      for (const entry of collection) {
        // value must be present and non-whitespace
        expect(entry.value.trim().length).toBeGreaterThan(0);
        // label must be present and non-whitespace
        expect(entry.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  // -------------------------------------------------------------------------
  // Test 3 — THEME_KEYS always starts with 'auto' and ends with 'random'
  //
  // Virtual themes act as the first/last fallback values in every theme
  // selector. If they are absent, the UI has no "automatic" or "random"
  // options, and the API may receive an undefined theme value.
  // This test also verifies that THEME_KEYS contains no empty-string entries,
  // which could happen if Object.keys(themes) ever includes a blank key.
  // -------------------------------------------------------------------------
  it('THEME_KEYS starts with "auto", ends with "random", and contains no empty-string entries', () => {
    // Boundary guard: first and last virtual entries must always be present
    expect(THEME_KEYS[0]).toBe('auto');
    expect(THEME_KEYS[THEME_KEYS.length - 1]).toBe('random');

    // No theme key should ever be an empty string (guards against accidental
    // blank entries being introduced into lib/svg/themes.ts)
    for (const key of THEME_KEYS) {
      expect(key.trim().length).toBeGreaterThan(0);
    }
  });

  // -------------------------------------------------------------------------
  // Test 4 — CustomizeOptions accepts and preserves empty/zero-value fields
  //
  // The CustomizeOptions interface allows several fields to be empty strings
  // (username, year) or numeric zero (grace, radius). This test constructs
  // an object with those minimal/empty values and asserts that TypeScript
  // accepts the shape and that the values round-trip without mutation.
  // This catches regressions where a field is accidentally made non-optional
  // or a default fallback silently overwrites a legitimate empty input.
  // -------------------------------------------------------------------------
  it('CustomizeOptions preserves empty string and zero-value fields without mutation', () => {
    // Construct the minimal object that the interface allows.
    // Empty username is valid — the UI shows a placeholder until the user types.
    const minimal: CustomizeOptions = {
      username: '', // empty — no user typed yet
      theme: 'dark' as ThemeOption,
      bgHex: '', // empty — no custom bg color chosen
      bgType: 'solid',
      bgStart: '',
      bgEnd: '',
      bgAngle: 0, // zero angle — valid boundary value
      accentHex: '',
      textHex: '',
      scale: 'linear',
      speed: '8s',
      font: '', // empty — falls back to default rendering font
      year: '', // empty — no year filter
      radius: 0, // zero radius — valid (sharp corners)
      size: 'medium',
      hideTitle: false,
      hideBackground: false,
      hideStats: false,
      viewMode: 'default' as ViewMode,
      deltaFormat: 'percent' as DeltaFormat,
      badgeWidth: '', // empty string variant (not a number)
      badgeHeight: '',
      grace: 0, // zero grace days — valid boundary value
      language: 'en' as Language,
      timezone: 'UTC' as Timezone,
    };

    // All empty/zero fields must survive round-trip through JSON (simulating
    // serialization to localStorage or a URL state hook) without being lost.
    const roundTripped: CustomizeOptions = JSON.parse(JSON.stringify(minimal));

    expect(roundTripped.username).toBe('');
    expect(roundTripped.bgHex).toBe('');
    expect(roundTripped.font).toBe('');
    expect(roundTripped.year).toBe('');
    expect(roundTripped.bgAngle).toBe(0);
    expect(roundTripped.radius).toBe(0);
    expect(roundTripped.grace).toBe(0);
    expect(roundTripped.badgeWidth).toBe('');
    expect(roundTripped.badgeHeight).toBe('');
  });

  // -------------------------------------------------------------------------
  // Test 5 — Default/fallback values exist as valid entries in their arrays
  //
  // Several options have documented defaults (e.g. speed '8s', size 'medium',
  // timezone 'UTC', language 'en', deltaFormat 'percent', viewMode 'default').
  // If a default is ever renamed or removed from its array, the UI silently
  // selects nothing (blank <option>) while the API rejects the parameter.
  // Assert that every documented default is a member of its option array.
  // -------------------------------------------------------------------------
  it('documented default values are present in their respective option arrays', () => {
    const speedValues = SPEEDS.map((s) => s.value);
    const sizeValues = SIZES.map((s) => s.value);
    const viewModeValues = VIEW_MODES.map((v) => v.value);
    const deltaFormatValues = DELTA_FORMATS.map((d) => d.value);
    const languageValues = LANGUAGES.map((l) => l.value);
    const timezoneValues = TIMEZONES.map((t) => t.value);

    // speed: '8s' is explicitly labelled "Default (8s)" in the SPEEDS array
    expect(speedValues).toContain('8s');

    // size: 'medium' is explicitly labelled "Medium (Default)" in SIZES
    expect(sizeValues).toContain('medium');

    // viewMode: 'default' is the initial view the API serves
    expect(viewModeValues).toContain('default');

    // deltaFormat: 'percent' is the default comparison display mode
    expect(deltaFormatValues).toContain('percent');

    // language: 'en' (English) is the fallback when no lang param is sent
    expect(languageValues).toContain('en');

    // timezone: 'UTC' is the default; labelled "UTC (Default)" in TIMEZONES
    expect(timezoneValues).toContain('UTC');

    // virtual theme defaults must be in THEME_KEYS
    expect(THEME_KEYS as string[]).toContain('auto');
    expect(THEME_KEYS as string[]).toContain('random');
  });
});
