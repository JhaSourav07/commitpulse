import { describe, it, expect } from 'vitest';
import { compareParamsSchema } from './validations';

describe('compareParamsSchema', () => {
  it('parses valid user1 and user2 parameters', () => {
    const result = compareParamsSchema.safeParse({
      user1: 'octocat',
      user2: 'torvalds',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user1).toBe('octocat');
      expect(result.data.user2).toBe('torvalds');
    }
  });

  it('trims whitespace from usernames before validation', () => {
    const result = compareParamsSchema.safeParse({
      user1: '  octocat  ',
      user2: '  torvalds  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user1).toBe('octocat');
      expect(result.data.user2).toBe('torvalds');
    }
  });

  it('fails validation when user1 or user2 is missing or empty', () => {
    expect(compareParamsSchema.safeParse({ user2: 'torvalds' }).success).toBe(false);
    expect(compareParamsSchema.safeParse({ user1: 'octocat' }).success).toBe(false);
    expect(compareParamsSchema.safeParse({ user1: '', user2: 'torvalds' }).success).toBe(false);
    expect(compareParamsSchema.safeParse({ user1: 'octocat', user2: '' }).success).toBe(false);
  });

  it('fails validation when usernames exceed 39 characters', () => {
    const longUser = 'a'.repeat(40);
    expect(compareParamsSchema.safeParse({ user1: longUser, user2: 'torvalds' }).success).toBe(
      false
    );
    expect(compareParamsSchema.safeParse({ user1: 'octocat', user2: longUser }).success).toBe(
      false
    );
  });

  it('fails validation when usernames contain invalid characters', () => {
    expect(
      compareParamsSchema.safeParse({ user1: 'invalid-user!', user2: 'torvalds' }).success
    ).toBe(false);
    expect(compareParamsSchema.safeParse({ user1: 'octocat', user2: 'invalid_user' }).success).toBe(
      false
    );
  });

  it('fails validation when trying to compare a user with themselves case-insensitively', () => {
    const resultSame = compareParamsSchema.safeParse({
      user1: 'octocat',
      user2: 'octocat',
    });
    expect(resultSame.success).toBe(false);
    if (!resultSame.success) {
      expect(resultSame.error.issues[0].message).toBe('Cannot compare a user with themselves.');
    }

    const resultCase = compareParamsSchema.safeParse({
      user1: 'OctoCat',
      user2: 'octocat',
    });
    expect(resultCase.success).toBe(false);
    if (!resultCase.success) {
      expect(resultCase.error.issues[0].message).toBe('Cannot compare a user with themselves.');
    }
  });
});
