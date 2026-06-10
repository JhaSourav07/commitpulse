// lib/svg/generator.themeLookup.test.ts

import { describe, it, expect } from 'vitest';
import { resolveFont } from './generator';

describe('themeLookup / font resolving behavior', () => {
  it('should return null if no font parameter is provided', () => {
    expect(resolveFont()).toBeNull();
    expect(resolveFont(null)).toBeNull();
    expect(resolveFont('')).toBeNull();
  });

  it('should resolve bundled fonts standard parameters correctly', () => {
    expect(resolveFont('jetbrains')).toBe('"JetBrains Mono", monospace');
    expect(resolveFont('fira')).toBe('"Fira Code", monospace');
    expect(resolveFont('roboto')).toBe('"Roboto", sans-serif');
  });

  it('should resolve previously missing bundled fonts without dynamic dynamic google font trigger', () => {
    expect(resolveFont('syncopate')).toBe('"Syncopate", sans-serif');
    expect(resolveFont('spacegrotesk')).toBe('"Space Grotesk", sans-serif');
  });

  it('should remain robust and case-insensitive under out-of-bounds or spaced inputs', () => {
    expect(resolveFont('JETBRAINS')).toBe('"JetBrains Mono", monospace');
    expect(resolveFont('space grotesk')).toBe('"Space Grotesk", sans-serif');
    expect(resolveFont('JetBrains Mono')).toBe('"JetBrains Mono", monospace');
  });

  it('should fall back gracefully to a standard sans-serif font stack for unrecognized dynamic fonts', () => {
    expect(resolveFont('Comic Sans')).toBe('"Comic Sans", sans-serif');
    expect(resolveFont('custom-font')).toBe('"custom-font", sans-serif');
  });
});
