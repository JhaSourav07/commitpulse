import { describe, expect, it } from 'vitest';

import FONT_MAP, { resolveFont, isPredefinedFontKey } from './fonts';

describe('fonts Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('resolves thousands of predefined font lookups without degradation', () => {
    const start = performance.now();

    const results = Array.from({ length: 10000 }, () => resolveFont('jetbrains'));

    const duration = performance.now() - start;

    expect(results).toHaveLength(10000);

    results.forEach((font) => {
      expect(font).toBe(FONT_MAP.jetbrains);
    });

    expect(duration).toBeLessThan(1000);
  });

  it('resolves thousands of unique custom font names correctly', () => {
    const customFonts = Array.from({ length: 5000 }, (_, index) => `CustomFont${index}`);

    const resolved = customFonts.map((font) => resolveFont(font));

    expect(resolved).toHaveLength(5000);

    expect(resolved[0]).toBe('"CustomFont0", sans-serif');
    expect(resolved[4999]).toBe('"CustomFont4999", sans-serif');
  });

  it('handles massive predefined font key validation operations', () => {
    const start = performance.now();

    const checks = Array.from({ length: 15000 }, (_, index) =>
      isPredefinedFontKey(index % 2 === 0 ? 'roboto' : 'jetbrains')
    );

    const duration = performance.now() - start;

    expect(checks.every(Boolean)).toBe(true);

    expect(duration).toBeLessThan(1000);
  });

  it('processes mixed valid and invalid font inputs at scale', () => {
    const inputs = Array.from({ length: 10000 }, (_, index) => {
      if (index % 4 === 0) return 'jetbrains';
      if (index % 4 === 1) return 'Inter';
      if (index % 4 === 2) return '';
      return undefined;
    });

    const results = inputs.map((font) => resolveFont(font));

    expect(results).toHaveLength(10000);

    expect(results.filter((value) => value === null).length).toBeGreaterThan(0);

    expect(results.filter((value) => value === FONT_MAP.jetbrains).length).toBeGreaterThan(0);

    expect(results.filter((value) => value === '"Inter", sans-serif').length).toBeGreaterThan(0);
  });

  it('maintains consistent output during repeated high-volume execution cycles', () => {
    for (let cycle = 0; cycle < 100; cycle++) {
      expect(resolveFont('spacegrotesk')).toBe('"Space Grotesk", sans-serif');

      expect(resolveFont('jetbrains')).toBe('"JetBrains Mono", monospace');

      expect(isPredefinedFontKey('spacegrotesk')).toBe(true);

      expect(isPredefinedFontKey('Inter')).toBe(false);
    }
  });
});
