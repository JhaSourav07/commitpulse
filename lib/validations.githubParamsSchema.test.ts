import { describe, expect, it } from 'vitest';

import { githubParamsSchema } from './validations';

const parseValid = (params: Record<string, unknown>) => {
  const result = githubParamsSchema.safeParse(params);

  expect(result.success).toBe(true);

  if (!result.success) {
    throw new Error('Expected githubParamsSchema to parse successfully');
  }

  return result.data;
};

const parseInvalid = (params: Record<string, unknown>) => {
  const result = githubParamsSchema.safeParse(params);

  expect(result.success).toBe(false);

  if (result.success) {
    throw new Error('Expected githubParamsSchema to fail validation');
  }

  return result.error.flatten().fieldErrors;
};

describe('githubParamsSchema', () => {
  it('parses a valid username and defaults refresh to false', () => {
    const data = parseValid({ username: 'octocat' });

    expect(data.username).toBe('octocat');
    expect(data.refresh).toBe(false);
  });

  it('trims username whitespace before validation', () => {
    const data = parseValid({ username: '  octocat  ' });

    expect(data.username).toBe('octocat');
  });

  it('transforms refresh to true only when value is exactly "true"', () => {
    expect(parseValid({ username: 'octocat', refresh: 'true' }).refresh).toBe(true);

    expect(parseValid({ username: 'octocat', refresh: 'false' }).refresh).toBe(false);

    expect(parseValid({ username: 'octocat', refresh: '1' }).refresh).toBe(false);

    expect(parseValid({ username: 'octocat', refresh: 'TRUE' }).refresh).toBe(false);
  });

  it('rejects missing, empty, and whitespace-only usernames with clear errors', () => {
    expect(parseInvalid({}).username?.[0]).toBe('Missing "username" parameter');

    expect(parseInvalid({ username: '' }).username?.[0]).toBe('Username is required');

    expect(parseInvalid({ username: '   ' }).username?.[0]).toBe('Username is required');
  });

  it('enforces GitHub username length boundaries', () => {
    const maxLengthUsername = 'a'.repeat(39);

    expect(parseValid({ username: maxLengthUsername }).username).toBe(maxLengthUsername);

    expect(parseInvalid({ username: 'a'.repeat(40) }).username?.[0]).toBe(
      'GitHub username cannot exceed 39 characters'
    );
  });

  it('accepts valid GitHub username formats and rejects invalid ones', () => {
    expect(parseValid({ username: 'valid-user-123' }).username).toBe('valid-user-123');

    expect(parseInvalid({ username: '-octocat' }).username?.[0]).toBe('Invalid GitHub username');

    expect(parseInvalid({ username: 'octocat-' }).username?.[0]).toBe('Invalid GitHub username');

    expect(parseInvalid({ username: 'octo--cat' }).username?.[0]).toBe('Invalid GitHub username');

    expect(parseInvalid({ username: 'octo_cat' }).username?.[0]).toBe('Invalid GitHub username');
  });
});
