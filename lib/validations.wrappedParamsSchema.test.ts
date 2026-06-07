import { describe, it, expect } from 'vitest';
import { wrappedParamsSchema } from './validations';

describe('wrappedParamsSchema', () => {
  it('parses a minimal valid input with only user', () => {
    const result = wrappedParamsSchema.safeParse({ user: 'octocat' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user).toBe('octocat');
      expect(result.data.theme).toBe('dark');
      expect(result.data.speed).toBe('8s');
      expect(result.data.radius).toBe(8);
    }
  });

  it('parses a full valid input with optional params', () => {
    const result = wrappedParamsSchema.safeParse({
      user: 'octocat',
      year: '2024',
      theme: 'neon',
      bg: '121212',
      text: 'f0f0f0',
      accent: 'ff5555,55ff55',
      speed: '5s',
      radius: '12',
      refresh: 'true',
      hide_title: '1',
      hide_background: 'true',
      width: '800',
      height: '600',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe('2024');
      expect(result.data.theme).toBe('neon');
      expect(result.data.bg).toBe('121212');
      expect(result.data.text).toBe('f0f0f0');
      expect(result.data.accent).toEqual(['ff5555', '55ff55']);
      expect(result.data.speed).toBe('5s');
      expect(result.data.radius).toBe(12);
      expect(result.data.refresh).toBe(true);
      expect(result.data.hide_title).toBe(true);
      expect(result.data.hide_background).toBe(true);
      expect(result.data.width).toBe(800);
      expect(result.data.height).toBe(600);
    }
  });

  it('fails validation on invalid user parameters', () => {
    expect(wrappedParamsSchema.safeParse({}).success).toBe(false);
    expect(wrappedParamsSchema.safeParse({ user: '' }).success).toBe(false);
    expect(wrappedParamsSchema.safeParse({ user: 'a'.repeat(40) }).success).toBe(false);
    expect(wrappedParamsSchema.safeParse({ user: 'invalid-user!' }).success).toBe(false);
  });

  it('fails validation on invalid year formats and ranges', () => {
    expect(wrappedParamsSchema.safeParse({ user: 'octocat', year: '2007' }).success).toBe(false);
    const nextYear = (new Date().getFullYear() + 1).toString();
    expect(wrappedParamsSchema.safeParse({ user: 'octocat', year: nextYear }).success).toBe(false);
    expect(wrappedParamsSchema.safeParse({ user: 'octocat', year: 'abc' }).success).toBe(false);
  });

  it('fails validation on invalid hex colors', () => {
    expect(wrappedParamsSchema.safeParse({ user: 'octocat', bg: 'not-hex' }).success).toBe(false);
    expect(wrappedParamsSchema.safeParse({ user: 'octocat', text: '12' }).success).toBe(false);
    expect(wrappedParamsSchema.safeParse({ user: 'octocat', accent: '123456789' }).success).toBe(
      false
    );
  });

  it('fails validation on out of range width and height', () => {
    expect(wrappedParamsSchema.safeParse({ user: 'octocat', width: '99' }).success).toBe(false);
    expect(wrappedParamsSchema.safeParse({ user: 'octocat', width: '1201' }).success).toBe(false);
    expect(wrappedParamsSchema.safeParse({ user: 'octocat', height: '79' }).success).toBe(false);
    expect(wrappedParamsSchema.safeParse({ user: 'octocat', height: '801' }).success).toBe(false);
  });
});
