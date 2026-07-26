import { notifyPostSchema } from './validations';
import { describe, it, expect } from 'vitest';

describe('notifyPostSchema', () => {
  it('parses valid input and applies correct defaults', () => {
    const result = notifyPostSchema.safeParse({
      username: 'octocat',
      email: 'octocat@github.com',
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      username: 'octocat',
      email: 'octocat@github.com',
      frequency: 'daily',
      preferences: {
        notifyOnCommit: true,
        notifyOnStreak: true,
        notifyOnMilestone: true,
      },
    });
  });

  it('rejects invalid username — missing, empty, whitespace-only, too long, bad format', () => {
    const missing = notifyPostSchema.safeParse({ email: 'a@b.com' });
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((i) => i.message)).toContain('Username is required.');

    const empty = notifyPostSchema.safeParse({ username: '', email: 'a@b.com' });
    expect(empty.success).toBe(false);
    expect(empty.error?.issues.map((i) => i.message)).toContain('Username is required.');

    const whitespace = notifyPostSchema.safeParse({ username: '   ', email: 'a@b.com' });
    expect(whitespace.success).toBe(false);
    expect(whitespace.error?.issues.map((i) => i.message)).toContain('Username is required.');

    const tooLong = notifyPostSchema.safeParse({ username: 'a'.repeat(40), email: 'a@b.com' });
    expect(tooLong.success).toBe(false);
    expect(tooLong.error?.issues.map((i) => i.message)).toContain(
      'GitHub username cannot exceed 39 characters.'
    );

    const badFormat = notifyPostSchema.safeParse({ username: '-badstart', email: 'a@b.com' });
    expect(badFormat.success).toBe(false);
    expect(badFormat.error?.issues.map((i) => i.message)).toContain(
      'Invalid GitHub username format.'
    );
  });

  it('rejects invalid email — missing, empty, and malformed', () => {
    const missing = notifyPostSchema.safeParse({ username: 'octocat' });
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((i) => i.message)).toContain('Email is required.');

    const empty = notifyPostSchema.safeParse({ username: 'octocat', email: '' });
    expect(empty.success).toBe(false);
    expect(empty.error?.issues.map((i) => i.message)).toContain('Email is required.');

    const malformed = notifyPostSchema.safeParse({ username: 'octocat', email: 'not-an-email' });
    expect(malformed.success).toBe(false);
    expect(malformed.error?.issues.map((i) => i.message)).toContain('Invalid email address.');
  });

  it('rejects invalid frequency value', () => {
    const result = notifyPostSchema.safeParse({
      username: 'octocat',
      email: 'octocat@github.com',
      frequency: 'monthly',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toContain(
      'Invalid frequency. Use realtime, daily, or weekly.'
    );
  });

  it('trims whitespace from username and email', () => {
    const result = notifyPostSchema.safeParse({
      username: '  octocat  ',
      email: '  octocat@github.com  ',
    });
    expect(result.success).toBe(true);
    expect(result.data?.username).toBe('octocat');
    expect(result.data?.email).toBe('octocat@github.com');
  });
});
