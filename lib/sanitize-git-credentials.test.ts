import { describe, expect, it } from 'vitest';
import {
  formatRepoRefForLogging,
  sanitizeErrorForLogging,
  sanitizeGitCredentialLeak,
} from './sanitize-git-credentials';

describe('sanitizeGitCredentialLeak', () => {
  it('redacts x-access-token credentials embedded in clone URLs', () => {
    const input =
      "fatal: could not read Username for 'https://x-access-token:ghp_super_secret@github.com': terminal prompts disabled";

    expect(sanitizeGitCredentialLeak(input)).toBe(
      "fatal: could not read Username for 'https://[REDACTED]@github.com': terminal prompts disabled"
    );
  });

  it('redacts generic userinfo embedded in URLs', () => {
    const input = 'Cloning into bare repo from https://user:password123@github.com/org/repo.git';

    expect(sanitizeGitCredentialLeak(input)).toBe(
      'Cloning into bare repo from https://[REDACTED]@github.com/org/repo.git'
    );
  });

  it('redacts standalone GitHub token strings', () => {
    const input = 'Authorization failed for token ghp_abcdefghijklmnopqrstuvwxyz1234567890';

    expect(sanitizeGitCredentialLeak(input)).toBe(
      'Authorization failed for token [REDACTED_GITHUB_TOKEN]'
    );
  });

  it('redacts Bearer tokens from error output', () => {
    const input = 'request failed: Authorization: Bearer gho_user_oauth_token_value';

    expect(sanitizeGitCredentialLeak(input)).toBe(
      'request failed: Authorization: Bearer [REDACTED]'
    );
  });
});

describe('sanitizeErrorForLogging', () => {
  it('sanitizes Error instances', () => {
    const err = new Error('clone failed for https://x-access-token:secret@github.com/a/b.git');

    expect(sanitizeErrorForLogging(err)).toBe(
      'clone failed for https://[REDACTED]@github.com/a/b.git'
    );
  });
});

describe('formatRepoRefForLogging', () => {
  it('formats owner/repo without URL credential material', () => {
    expect(formatRepoRefForLogging('octocat', 'hello-world')).toBe('octocat/hello-world');
  });
});
