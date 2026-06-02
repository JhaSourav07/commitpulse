import { describe, expect, it } from 'vitest';
import { notifyGetSchema } from './validations';

describe('notifyGetSchema', () => {
  it('accepts a valid GitHub username', () => {
    const result = notifyGetSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.user).toBe('octocat');
    }
  });

  it('trims surrounding whitespace from username', () => {
    const result = notifyGetSchema.safeParse({
      user: '  octocat  ',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.user).toBe('octocat');
    }
  });

  it('rejects missing user parameter', () => {
    const result = notifyGetSchema.safeParse({});

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Username is required.');
    }
  });

  it('rejects usernames longer than 39 characters', () => {
    const result = notifyGetSchema.safeParse({
      user: 'a'.repeat(40),
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('GitHub username cannot exceed 39 characters.');
    }
  });

  it('rejects invalid GitHub username format', () => {
    const result = notifyGetSchema.safeParse({
      user: 'invalid_username',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Invalid GitHub username format.');
    }
  });
});
