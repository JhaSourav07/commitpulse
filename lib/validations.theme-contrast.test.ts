import { describe, it, expect } from 'vitest';
import { toValidTheme, toValidHexColor, toOpacityValue, streakParamsSchema } from './validations';
import { themes } from './svg/themes';

describe('Validations color and theme consistency', () => {
  it('toValidTheme resolves auto, random, dark, light, and all defined theme names', () => {
    expect(toValidTheme()).toBe('dark');
    expect(toValidTheme('auto')).toBe('auto');
    expect(toValidTheme('random')).toBe('random');
    expect(toValidTheme('dark')).toBe('dark');
    expect(toValidTheme('light')).toBe('light');
    expect(toValidTheme('DARK')).toBe('dark');
    expect(toValidTheme('LIGHT')).toBe('light');
    expect(toValidTheme('invalid_theme')).toBe('dark');
  });

  it('toValidHexColor validates hex strings and returns sanitized color or undefined', () => {
    const validate = toValidHexColor('0d1117');
    expect(validate('ffffff')).toBe('ffffff');
    expect(validate('000000')).toBe('000000');
    expect(validate('c9d1d9')).toBe('c9d1d9');
    expect(validate('24292f')).toBe('24292f');
    expect(validate('invalid')).toBeUndefined();
    expect(validate(undefined)).toBeUndefined();
  });

  it('toOpacityValue clamps values within valid visual range', () => {
    expect(toOpacityValue()).toBe(1.0);
    expect(toOpacityValue('1.0')).toBe(1.0);
    expect(toOpacityValue('0.5')).toBe(0.5);
    expect(toOpacityValue('0.0')).toBe(0.1);
    expect(toOpacityValue('1.5')).toBe(1.0);
    expect(toOpacityValue('invalid')).toBe(1.0);
  });

  it('streakParamsSchema theme refinement accepts auto, random, and all known theme keys', async () => {
    const knownThemes = ['auto', 'random', ...Object.keys(themes)];
    const results = await Promise.all(
      knownThemes.map((theme) => streakParamsSchema.safeParseAsync({ user: 'octocat', theme }))
    );
    for (const result of results) {
      expect(result.success).toBe(true);
    }
  });

  it('streakParamsSchema bg and text hex color validations accept valid with or without #', async () => {
    const withHash = await streakParamsSchema.safeParseAsync({
      user: 'octocat',
      bg: '#0d1117',
      text: '#ffffff',
    });
    expect(withHash.success).toBe(true);

    const withoutHash = await streakParamsSchema.safeParseAsync({
      user: 'octocat',
      bg: '0d1117',
      text: 'ffffff',
    });
    expect(withoutHash.success).toBe(true);

    const invalid = await streakParamsSchema.safeParseAsync({
      user: 'octocat',
      bg: 'not-a-color',
    });
    expect(invalid.success).toBe(false);
  });
});
