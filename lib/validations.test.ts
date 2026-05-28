import { describe, expect, it } from 'vitest';
import { githubParamsSchema } from './validations';

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
