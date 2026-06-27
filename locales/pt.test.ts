import { describe, it, expect } from 'vitest';
import { LANGUAGE_LABELS } from '@/context/TranslationContext';
import en from './en.json';
import pt from './pt.json';

// Flatten a nested locale object into dot-paths -> string leaves. We compare the
// *entire* key surface (not just the top level) because a single missing nested
// key silently falls back to English in the UI via the t() helper, which is the
// kind of gap a reviewer can't spot by eye across 200+ strings.
function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object') {
      Object.assign(out, flatten(value as Record<string, unknown>, path));
    } else {
      out[path] = String(value);
    }
  }
  return out;
}

// Collect the {{placeholder}} tokens a string exposes to t()'s param replacement,
// sorted so order differences between languages don't cause false failures.
function placeholders(value: string): string[] {
  return (value.match(/{{\s*\w+\s*}}/g) ?? []).sort();
}

const enFlat = flatten(en);
const ptFlat = flatten(pt);

describe('Portuguese (pt) locale', () => {
  it('is registered in the language switcher as Português', () => {
    expect(LANGUAGE_LABELS.pt).toBe('Português');
  });

  it('defines exactly the same keys as the English source of truth', () => {
    expect(Object.keys(ptFlat).sort()).toEqual(Object.keys(enFlat).sort());
  });

  it('has a non-empty translation for every key', () => {
    const blank = Object.entries(ptFlat)
      .filter(([, value]) => value.trim().length === 0)
      .map(([path]) => path);
    expect(blank).toEqual([]);
  });

  it('preserves the same {{placeholder}} tokens as English in every value', () => {
    const mismatched = Object.keys(enFlat).filter(
      (path) => placeholders(enFlat[path]).join(',') !== placeholders(ptFlat[path] ?? '').join(',')
    );
    expect(mismatched).toEqual([]);
  });
});
