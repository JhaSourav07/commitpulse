import { describe, expect, it } from 'vitest';
import { themes } from './themes';

describe('themes', () => {
  it('should not use # prefix in background colors', () => {
    Object.values(themes).forEach((theme) => {
      expect(theme.bg.startsWith('#')).toBe(false);
    });
  });

  it('should not use # prefix in text colors', () => {
    Object.values(themes).forEach((theme) => {
      expect(theme.text.startsWith('#')).toBe(false);
    });
  });

  it('should not use # prefix in accent colors', () => {
    Object.values(themes).forEach((theme) => {
      expect(theme.accent.startsWith('#')).toBe(false);
    });
  });
});
