import { describe, expect, it } from 'vitest';
import { githubParamsSchema, streakParamsSchema } from './validations';

describe('githubParamsSchema', () => {
  it('should pass when username is valid', () => {
    const result = githubParamsSchema.safeParse({
      username: 'octocat',
    });

    expect(result.success).toBe(true);
  });

  it('should fail when username is omitted', () => {
    const result = githubParamsSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Missing "username" parameter');
    }
  });

  it('should fail when username is empty', () => {
    const result = githubParamsSchema.safeParse({
      username: '',
    });

    expect(result.success).toBe(false);
  });

  it('should transform refresh true string to boolean true', () => {
    const result = githubParamsSchema.safeParse({
      username: 'octocat',
      refresh: 'true',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.refresh).toBe(true);
    }
  });

  it('should transform refresh false string to boolean false', () => {
    const result = githubParamsSchema.safeParse({
      username: 'octocat',
      refresh: 'false',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.refresh).toBe(false);
    }
  });
});
describe('streakParamsSchema user validation', () => {
  it('should pass when user is valid', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);
  });

  it('should fail when user is omitted', () => {
    const result = streakParamsSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Missing user parameter');
    }
  });

  it('should fail when user is empty', () => {
    const result = streakParamsSchema.safeParse({
      user: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Missing user parameter');
    }
  });

  it('should fail when user exceeds 39 characters', () => {
    const result = streakParamsSchema.safeParse({
      user: 'a'.repeat(40),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('GitHub username cannot exceed 39 characters');
    }
  });

  it('should fail when user has invalid characters', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octo_cat',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Invalid GitHub username');
    }
  });
});

// Helper — parse only the fields we care about, supplying the required `user` field.
function parse(params: Record<string, string>) {
  return streakParamsSchema.parse({ user: 'octocat', ...params });
}

describe('streakParamsSchema — scale fallback behavior', () => {
  // z.enum(['linear', 'log']).catch('linear') — unknown values silently fall
  // back to 'linear' instead of throwing a validation error.

  it('accepts "log" as a valid scale value', () => {
    expect(parse({ scale: 'log' }).scale).toBe('log');
  });

  it('accepts "linear" as a valid scale value', () => {
    expect(parse({ scale: 'linear' }).scale).toBe('linear');
  });

  it('falls back to "linear" for unknown scale value', () => {
    expect(parse({ scale: 'exponential' }).scale).toBe('linear');
  });

  it('falls back to "linear" for empty string', () => {
    expect(parse({ scale: '' }).scale).toBe('linear');
  });

  it('defaults to "linear" when scale is omitted', () => {
    expect(parse({}).scale).toBe('linear');
  });
});

describe('streakParamsSchema — size fallback behavior', () => {
  // z.enum(['small', 'medium', 'large']).catch('medium') — unknown values
  // silently fall back to 'medium' to preserve badge rendering.

  it('accepts "small" as a valid size value', () => {
    expect(parse({ size: 'small' }).size).toBe('small');
  });

  it('accepts "medium" as a valid size value', () => {
    expect(parse({ size: 'medium' }).size).toBe('medium');
  });

  it('accepts "large" as a valid size value', () => {
    expect(parse({ size: 'large' }).size).toBe('large');
  });

  it('falls back to "medium" for unknown size value', () => {
    expect(parse({ size: 'giant' }).size).toBe('medium');
  });

  it('defaults to "medium" when size is omitted', () => {
    expect(parse({}).size).toBe('medium');
  });

  it('falls back to "medium" for empty string', () => {
    expect(parse({ size: '' }).size).toBe('medium');
  });
});
