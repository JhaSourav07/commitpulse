import { describe, it, expect } from 'vitest';
import { stripHash, isValidHex } from './utils';

describe('Customize Utils', () => {
  describe('stripHash', () => {
    it('removes leading # from hex color', () => {
      expect(stripHash('#ff0000')).toBe('ff0000');
    });

    it('returns unchanged string if no # prefix', () => {
      expect(stripHash('ff0000')).toBe('ff0000');
    });

    it('handles empty string', () => {
      expect(stripHash('')).toBe('');
    });

    it('only removes leading #, not all occurrences', () => {
      expect(stripHash('##ff0000')).toBe('#ff0000');
    });

    it('handles just # character', () => {
      expect(stripHash('#')).toBe('');
    });
  });

  describe('isValidHex', () => {
    describe('valid 6-digit hex colors', () => {
      it('accepts lowercase hex without #', () => {
        expect(isValidHex('ffffff')).toBe(true);
        expect(isValidHex('000000')).toBe(true);
        expect(isValidHex('ff0000')).toBe(true);
      });

      it('accepts uppercase hex without #', () => {
        expect(isValidHex('FFFFFF')).toBe(true);
        expect(isValidHex('FF0000')).toBe(true);
      });

      it('accepts mixed case hex without #', () => {
        expect(isValidHex('FfFfFf')).toBe(true);
        expect(isValidHex('aAbBcC')).toBe(true);
      });

      it('accepts 6-digit hex with # prefix', () => {
        expect(isValidHex('#ffffff')).toBe(true);
        expect(isValidHex('#000000')).toBe(true);
      });
    });

    describe('invalid hex colors', () => {
      it('rejects non-hex characters', () => {
        expect(isValidHex('zzzzzz')).toBe(false);
        expect(isValidHex('gggggg')).toBe(false);
        expect(isValidHex('ff@0000')).toBe(false);
      });

      it('rejects wrong length', () => {
        expect(isValidHex('f')).toBe(false);
        expect(isValidHex('ff')).toBe(false);
        expect(isValidHex('fff')).toBe(false);
        expect(isValidHex('fffff')).toBe(false);
        expect(isValidHex('fffffff')).toBe(false);
        expect(isValidHex('ffffffff')).toBe(false);
      });

      it('rejects hex with # but invalid length', () => {
        expect(isValidHex('#fff')).toBe(false);
        expect(isValidHex('#fffff')).toBe(false);
      });

      it('rejects empty string', () => {
        expect(isValidHex('')).toBe(false);
      });

      it('rejects hex with invalid characters and #', () => {
        expect(isValidHex('#zzzzzz')).toBe(false);
        expect(isValidHex('#ff@000')).toBe(false);
      });
    });
  });
});
