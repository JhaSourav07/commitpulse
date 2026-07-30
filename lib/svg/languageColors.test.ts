import { describe, it, expect } from 'vitest';
import {
  LANGUAGE_COLORS,
  getLanguageColor,
  getLanguageColorOrDefault,
  getLanguageColorWithContrast,
} from './languageColors';

describe('languageColors', () => {
  describe('LANGUAGE_COLORS', () => {
    it('contains common languages', () => {
      expect(LANGUAGE_COLORS['TypeScript']).toBe('#3178c6');
      expect(LANGUAGE_COLORS['Python']).toBe('#3572A5');
      expect(LANGUAGE_COLORS['JavaScript']).toBe('#f1e05a');
    });
  });

  describe('getLanguageColor', () => {
    it('returns the correct color for known languages', () => {
      expect(getLanguageColor('TypeScript')).toBe('#3178c6');
      expect(getLanguageColor('Python')).toBe('#3572A5');
      expect(getLanguageColor('Rust')).toBe('#dea584');
    });

    it('returns empty string for unknown languages', () => {
      expect(getLanguageColor('Hare')).toBe('');
      expect(getLanguageColor('Brainfuck')).toBe('');
    });

    it('is case-sensitive', () => {
      expect(getLanguageColor('typescript')).toBe('');
      expect(getLanguageColor('TypeScript')).toBe('#3178c6');
    });
  });

  describe('getLanguageColorOrDefault', () => {
    it('returns the color for known languages', () => {
      expect(getLanguageColorOrDefault('Python')).toBe('#3572A5');
    });

    it('returns custom fallback for unknown languages', () => {
      expect(getLanguageColorOrDefault('Brainfuck', '#cccccc')).toBe('#cccccc');
    });

    it('returns default fallback when not provided', () => {
      expect(getLanguageColorOrDefault('Brainfuck')).toBe('#767676');
    });
  });

  describe('getLanguageColorWithContrast', () => {
    it('returns color and a contrasting text color for known languages', () => {
      const result = getLanguageColorWithContrast('TypeScript');
      expect(result.color).toBe('#3178c6');
      expect(['#000000', '#ffffff']).toContain(result.contrastColor);
    });

    it('returns fallback color with contrasting color for unknown languages', () => {
      const result = getLanguageColorWithContrast('Brainfuck');
      expect(result.color).toBe('#767676');
      expect(['#000000', '#ffffff']).toContain(result.contrastColor);
    });

    it('returns dark contrast for bright language colors', () => {
      // JavaScript yellow is bright, so it needs dark text
      const result = getLanguageColorWithContrast('JavaScript');
      expect(result.color).toBe('#f1e05a');
      expect(['#000000', '#ffffff']).toContain(result.contrastColor);
    });
  });
});
