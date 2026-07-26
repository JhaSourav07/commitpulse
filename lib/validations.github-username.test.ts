// lib/validations.github-username.test.ts
import { describe, it, expect } from 'vitest';
import { validateGitHubUsername } from './validations';

describe('validateGitHubUsername', () => {
  it('returns true for a valid simple username', () => {
    expect(validateGitHubUsername('octocat')).toBe(true);
  });

  it('returns true for a username with hyphens in the middle', () => {
    expect(validateGitHubUsername('my-repo')).toBe(true);
  });

  it('returns true for a username containing numbers', () => {
    expect(validateGitHubUsername('user123')).toBe(true);
  });

  it('returns true for a username starting with a number', () => {
    expect(validateGitHubUsername('8ball')).toBe(true);
  });

  it('returns true for a username with mixed case', () => {
    expect(validateGitHubUsername('GitHubUser')).toBe(true);
  });

  it('returns true for a 39-character username (maximum length)', () => {
    expect(validateGitHubUsername('a'.repeat(39))).toBe(true);
  });

  it('returns true for a username with multiple hyphens', () => {
    expect(validateGitHubUsername('my-awesome-repo')).toBe(true);
  });

  it('returns false for a username starting with a hyphen', () => {
    expect(validateGitHubUsername('-octocat')).toBe(false);
  });

  it('returns false for a username ending with a hyphen', () => {
    expect(validateGitHubUsername('octocat-')).toBe(false);
  });

  it('returns false for consecutive hyphens', () => {
    expect(validateGitHubUsername('my--repo')).toBe(false);
  });

  it('returns false for a username exceeding 39 characters', () => {
    expect(validateGitHubUsername('a'.repeat(40))).toBe(false);
  });

  it('returns false for a username containing underscores', () => {
    expect(validateGitHubUsername('my_repo')).toBe(false);
  });

  it('returns false for a username containing spaces', () => {
    expect(validateGitHubUsername('octo cat')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(validateGitHubUsername('')).toBe(false);
  });

  it('returns false for null input', () => {
    // @ts-expect-error -- intentionally passing non-string to test runtime behavior
    expect(validateGitHubUsername(null)).toBe(false);
  });

  it('returns false for undefined input', () => {
    // @ts-expect-error -- intentionally passing non-string to test runtime behavior
    expect(validateGitHubUsername(undefined)).toBe(false);
  });

  it('returns false for a numeric input', () => {
    // @ts-expect-error -- intentionally passing non-string to test runtime behavior
    expect(validateGitHubUsername(12345)).toBe(false);
  });

  it('returns false for a username with special characters', () => {
    expect(validateGitHubUsername('user@name')).toBe(false);
    expect(validateGitHubUsername('user!name')).toBe(false);
    expect(validateGitHubUsername('user#name')).toBe(false);
  });

  it('returns true for real GitHub usernames', () => {
    expect(validateGitHubUsername('torvalds')).toBe(true);
    expect(validateGitHubUsername('defunkt')).toBe(true);
    expect(validateGitHubUsername('kennethreitz')).toBe(true);
  });
});
