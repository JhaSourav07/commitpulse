import { describe, it, expect } from 'vitest';
import { User } from './User';

describe('User Empty Fallback', () => {
  it('applies default visitCount when omitted', () => {
    const user = new User({
      username: 'testuser',
    });

    expect(user.visitCount).toBe(0);
  });

  it('applies createdAt automatically when omitted', () => {
    const user = new User({
      username: 'testuser',
    });

    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('allows optional githubToken to be undefined', () => {
    const user = new User({
      username: 'testuser',
    });

    expect(user.githubToken).toBeUndefined();
  });

  it('allows optional lastSeen to be undefined', () => {
    const user = new User({
      username: 'testuser',
    });

    expect(user.lastSeen).toBeUndefined();
  });

  it('fails validation when username is missing', async () => {
    const user = new User({});

    await expect(user.validate()).rejects.toThrow();
  });
});
