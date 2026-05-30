import { describe, it, expect } from 'vitest';
import { THEME_KEYS } from './types';
import { themes } from '../../lib/svg/themes';

describe('Theme Keys Synchronization', () => {
  it('THEME_KEYS should exactly match the themes object keys plus "auto" and "random"', () => {
    // 1. Create the exact array of what should exist
    const expectedKeys = ['auto', ...Object.keys(themes), 'random'];

    // 2. Sort both arrays alphabetically so the test doesn't fail just because of order
    const sortedExpected = expectedKeys.sort();
    const sortedActual = [...THEME_KEYS].sort();

    // 3. Assert they are 100% identical (no missing keys, no extra obsolete keys)
    expect(sortedActual).toEqual(sortedExpected);
  });
});
