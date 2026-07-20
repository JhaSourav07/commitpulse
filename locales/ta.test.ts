import { describe, it, expect } from 'vitest';
import en from './en.json';
import ta from './ta.json';

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object') {
      Object.assign(out, flatten(value as Record<string, unknown>, path));
    } else {
      out[path] = value;
    }
  }
  return out;
}

describe('Tamil (ta) locale', () => {
  it('has exactly the same keys as en.json (no missing/extra keys)', () => {
    const enKeys = Object.keys(flatten(en)).sort();
    const taKeys = Object.keys(flatten(ta)).sort();
    expect(taKeys).toEqual(enKeys);
  });

  it('every value is a non-empty string', () => {
    const flat = flatten(ta);
    for (const [key, value] of Object.entries(flat)) {
      expect(typeof value, `key "${key}" should be a string`).toBe('string');
      expect((value as string).trim().length, `key "${key}" should not be empty`).toBeGreaterThan(
        0
      );
    }
  });

  it('preserves every {{placeholder}} token present in the English source', () => {
    const enFlat = flatten(en);
    const taFlat = flatten(ta);
    const placeholderRegex = /\{\{[^}]+\}\}/g;

    for (const [key, enValue] of Object.entries(enFlat)) {
      const enPlaceholders = (String(enValue).match(placeholderRegex) || []).sort();
      if (enPlaceholders.length === 0) continue;

      const taPlaceholders = (String(taFlat[key]).match(placeholderRegex) || []).sort();
      expect(taPlaceholders, `key "${key}" is missing a placeholder`).toEqual(enPlaceholders);
    }
  });
});
