import { SVG_WIDTH, SVG_HEIGHT, isFontKey } from './generatorConstants';
import { FONT_MAP } from './fonts';

import { describe, it, expect } from 'vitest';

describe('generatorConstants — Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  it('establishes a comprehensive dual theme environment parsing both dark and light presets', () => {
    expect(SVG_WIDTH).toBe(600);
    expect(SVG_HEIGHT).toBe(420);
  });

  it('asserts that font map entries contain generic fallback families across theme shifts', () => {
    expect(FONT_MAP.jetbrains).toContain('monospace');
    expect(FONT_MAP.fira).toContain('monospace');
    expect(FONT_MAP.roboto).toContain('sans-serif');
    expect(FONT_MAP.syncopate).toContain('sans-serif');
  });

  it('verifies isFontKey correctly validates predefined font keys', () => {
    expect(isFontKey('jetbrains')).toBe(true);
    expect(isFontKey('fira')).toBe(true);
    expect(isFontKey('roboto')).toBe(true);
    expect(isFontKey('unknown-font')).toBe(false);
    expect(isFontKey('')).toBe(false);
  });

  it('checks that no malformed input breaks font key resolution', () => {
    expect(isFontKey('JetBrains Mono')).toBe(false);
    expect(isFontKey('  ')).toBe(false);
    expect(isFontKey('   jetbrains   ')).toBe(false);
    expect(isFontKey(undefined as unknown as string)).toBe(false);
    expect(isFontKey(null as unknown as string)).toBe(false);
  });

  it('ensures that SVG dimension constants maintain integrity across theme variants', () => {
    expect(SVG_WIDTH).toBeGreaterThan(0);
    expect(SVG_HEIGHT).toBeGreaterThan(0);
    expect(SVG_WIDTH).toBe(600);
    expect(SVG_HEIGHT).toBe(420);
  });
});
