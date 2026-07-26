import { describe, expect, it } from 'vitest';
import { ogParamsSchema } from './validations';

describe('ogParamsSchema', () => {
  it('parses valid OpenGraph parameters successfully', () => {
    const result = ogParamsSchema.safeParse({
      user: 'octocat',
      theme: 'dark',
      bg: 'ffffff',
      text: '000000',
      accent: 'ff0000',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.user).toBe('octocat');
      expect(result.data.theme).toBe('dark');
      expect(result.data.bg).toBe('ffffff');
      expect(result.data.text).toBe('000000');
      expect(result.data.accent).toBe('ff0000');
    }
  });

  it('applies default theme when omitted', () => {
    const result = ogParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.theme).toBe('dark');
    }
  });

  it('falls back to username when user is not provided', () => {
    const result = ogParamsSchema.safeParse({
      username: 'fallback-user',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.user).toBe('fallback-user');
    }
  });

  it('falls back to unknown when both user and username are missing', () => {
    const result = ogParamsSchema.safeParse({});

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.user).toBe('unknown');
    }
  });

  it('normalizes valid hex color values', () => {
    const result = ogParamsSchema.safeParse({
      user: 'octocat',
      bg: 'ABCDEF',
      text: '123456',
      accent: 'ff00ff',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.bg).toBe('ABCDEF');
      expect(result.data.text).toBe('123456');
      expect(result.data.accent).toBe('ff00ff');
    }
  });

  it('falls back to default color for invalid hex values', () => {
    const result = ogParamsSchema.safeParse({
      user: 'octocat',
      bg: 'invalid-color',
      text: 'xyz',
      accent: '12345',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.bg).toBeUndefined();
      expect(result.data.text).toBeUndefined();
      expect(result.data.accent).toBeUndefined();
    }
  });
});
