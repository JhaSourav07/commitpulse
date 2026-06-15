// lib/svg/generatorConstants.accessibility.test.ts

import { describe, expect, it } from 'vitest';
import { SVG_WIDTH, SVG_HEIGHT, isFontKey } from './generatorConstants';
import { FONT_MAP } from './fonts';

describe('Generator Constants Accessibility', () => {
  it('provides SVG canvas dimensions that respect WCAG minimum target sizes for embedded badges', () => {
    // WCAG 2.5.5 (Target Size) recommends interactive targets be at least 24×24 px.
    // The badge canvas must comfortably exceed this so embedded content stays legible.
    expect(typeof SVG_WIDTH).toBe('number');
    expect(typeof SVG_HEIGHT).toBe('number');
    expect(Number.isFinite(SVG_WIDTH)).toBe(true);
    expect(Number.isFinite(SVG_HEIGHT)).toBe(true);

    expect(SVG_WIDTH).toBeGreaterThanOrEqual(24);
    expect(SVG_HEIGHT).toBeGreaterThanOrEqual(24);
  });

  it('maintains a landscape aspect ratio so the rendered badge stays readable when embedded in README files', () => {
    // README badges are commonly viewed at narrow column widths; a landscape
    // ratio prevents text labels from wrapping or being clipped by screen readers
    // that announce content in document flow order.
    expect(SVG_WIDTH).toBeGreaterThan(SVG_HEIGHT);

    const aspectRatio = SVG_WIDTH / SVG_HEIGHT;
    expect(aspectRatio).toBeGreaterThan(1);
    expect(aspectRatio).toBeLessThan(3);
  });

  it('exposes a non-empty FONT_MAP so every text node has a resolvable accessible font-family', () => {
    // Empty or missing font definitions cause screen readers and browser
    // fallbacks to render unstyled text — breaking the design system contract.
    const fontKeys = Object.keys(FONT_MAP);
    expect(fontKeys.length).toBeGreaterThan(0);

    Object.values(FONT_MAP).forEach((fontFamily) => {
      expect(typeof fontFamily).toBe('string');
      expect(fontFamily.trim().length).toBeGreaterThan(0);
      // Every font stack must include a generic fallback (sans-serif / serif / monospace)
      // so accessible rendering is preserved when the primary font fails to load.
      expect(/sans-serif|serif|monospace/i.test(fontFamily)).toBe(true);
    });
  });

  it('isFontKey safely rejects malicious or malformed input that could break accessible text rendering', () => {
    // The type guard sits at the boundary between user input and SVG output;
    // it must reject anything that isn't an explicit known key.
    expect(isFontKey('unknown-font')).toBe(false);
    expect(isFontKey('')).toBe(false);
    expect(isFontKey('<script>alert(1)</script>')).toBe(false);
    expect(isFontKey('SVG_WIDTH')).toBe(false);
    expect(isFontKey('   ')).toBe(false);
  });

  it('isFontKey accepts every declared FONT_MAP key so accessible font selection works for all bundled fonts', () => {
    // Each declared key must round-trip through the guard. If a key fails this,
    // users who request that font will silently fall back — breaking design-system fidelity.
    Object.keys(FONT_MAP).forEach((key) => {
      expect(isFontKey(key)).toBe(true);
    });
  });
});
