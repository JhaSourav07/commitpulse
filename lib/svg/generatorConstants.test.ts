import { describe, it, expect } from 'vitest';
import { SVG_WIDTH, SVG_HEIGHT, FONT_MAP, isFontKey } from './generatorConstants';

describe('generatorConstants', () => {
  it('SVG_WIDTH equals 600', () => {
    expect(SVG_WIDTH).toBe(600);
  });

  it('SVG_HEIGHT equals 420', () => {
    expect(SVG_HEIGHT).toBe(420);
  });

  it('FONT_MAP jetbrains contains JetBrains Mono', () => {
    expect(FONT_MAP.jetbrains).toContain('JetBrains Mono');
  });

  it('FONT_MAP fira contains Fira Code', () => {
    expect(FONT_MAP.fira).toContain('Fira Code');
  });

  it('FONT_MAP roboto contains Roboto', () => {
    expect(FONT_MAP.roboto).toContain('Roboto');
  });

  it('isFontKey returns true for jetbrains', () => {
    expect(isFontKey('jetbrains')).toBe(true);
  });

  it('isFontKey returns true for roboto', () => {
    expect(isFontKey('roboto')).toBe(true);
  });

  it('isFontKey returns false for unknown-font', () => {
    expect(isFontKey('unknown-font')).toBe(false);
  });

  it('isFontKey returns false for empty string', () => {
    expect(isFontKey('')).toBe(false);
  });
});
