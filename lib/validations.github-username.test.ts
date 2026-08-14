import { describe, it, expect } from 'vitest';
import { validateGitHubUsername } from './validations';

describe('validateGitHubUsername', () => {
  describe('Valid Usernames', () => {
    it('accepts simple alphanumeric usernames', () => {
      expect(validateGitHubUsername('octocat')).toBe(true);
      expect(validateGitHubUsername('john')).toBe(true);
      expect(validateGitHubUsername('a')).toBe(true);
    });

    it('accepts hyphenated usernames with single hyphens between characters', () => {
      expect(validateGitHubUsername('octo-cat')).toBe(true);
      expect(validateGitHubUsername('a-b-c-d')).toBe(true);
      expect(validateGitHubUsername('my-cool-github-user')).toBe(true);
    });

    it('accepts numeric usernames', () => {
      expect(validateGitHubUsername('12345')).toBe(true);
      expect(validateGitHubUsername('0')).toBe(true);
      expect(validateGitHubUsername('9876543210')).toBe(true);
    });

    it('accepts mixed case usernames', () => {
      expect(validateGitHubUsername('OctoCat')).toBe(true);
      expect(validateGitHubUsername('JohnDoe')).toBe(true);
      expect(validateGitHubUsername('aBcDeF')).toBe(true);
    });

    it('accepts usernames up to maximum length of 39 characters', () => {
      const maxLen39 = 'a'.repeat(39);
      expect(validateGitHubUsername(maxLen39)).toBe(true);

      const maxLenHyphenated39 = 'a'.repeat(19) + '-' + 'b'.repeat(19);
      expect(maxLenHyphenated39.length).toBe(39);
      expect(validateGitHubUsername(maxLenHyphenated39)).toBe(true);
    });
  });

  describe('Invalid Usernames', () => {
    it('rejects empty strings', () => {
      expect(validateGitHubUsername('')).toBe(false);
    });

    it('rejects null and undefined inputs', () => {
      expect(validateGitHubUsername(null as unknown as string)).toBe(false);
      expect(validateGitHubUsername(undefined as unknown as string)).toBe(false);
    });

    it('rejects non-string inputs such as numeric or object types', () => {
      expect(validateGitHubUsername(12345 as unknown as string)).toBe(false);
      expect(validateGitHubUsername(0 as unknown as string)).toBe(false);
      expect(validateGitHubUsername(true as unknown as string)).toBe(false);
      expect(validateGitHubUsername({} as unknown as string)).toBe(false);
      expect(validateGitHubUsername([] as unknown as string)).toBe(false);
    });

    it('rejects usernames with special characters', () => {
      expect(validateGitHubUsername('user@name')).toBe(false);
      expect(validateGitHubUsername('user#123')).toBe(false);
      expect(validateGitHubUsername('user!cat')).toBe(false);
      expect(validateGitHubUsername('user$name')).toBe(false);
      expect(validateGitHubUsername('user.name')).toBe(false);
      expect(validateGitHubUsername('user/repo')).toBe(false);
    });

    it('rejects usernames starting or ending with hyphens', () => {
      expect(validateGitHubUsername('-octocat')).toBe(false);
      expect(validateGitHubUsername('octocat-')).toBe(false);
      expect(validateGitHubUsername('-octocat-')).toBe(false);
      expect(validateGitHubUsername('-')).toBe(false);
    });

    it('rejects usernames with consecutive hyphens', () => {
      expect(validateGitHubUsername('octo--cat')).toBe(false);
      expect(validateGitHubUsername('a--b')).toBe(false);
      expect(validateGitHubUsername('octo---cat')).toBe(false);
    });

    it('rejects usernames exceeding maximum length of 39 characters', () => {
      const len40 = 'a'.repeat(40);
      expect(validateGitHubUsername(len40)).toBe(false);

      const len50 = 'octocat'.repeat(8);
      expect(validateGitHubUsername(len50)).toBe(false);
    });

    it('rejects usernames containing spaces', () => {
      expect(validateGitHubUsername('octo cat')).toBe(false);
      expect(validateGitHubUsername(' octocat')).toBe(false);
      expect(validateGitHubUsername('octocat ')).toBe(false);
    });

    it('rejects usernames containing underscores', () => {
      expect(validateGitHubUsername('octo_cat')).toBe(false);
      expect(validateGitHubUsername('_octocat')).toBe(false);
      expect(validateGitHubUsername('octocat_')).toBe(false);
    });
  });

  describe('Real GitHub Usernames', () => {
    it('accepts real GitHub usernames for positive cases', () => {
      const realUsernames = [
        'torvalds',
        'gaearon',
        'sindresorhus',
        'tj',
        'JhaSourav07',
        'tmdeveloper007',
        'Rakshak05',
      ];

      for (const username of realUsernames) {
        expect(validateGitHubUsername(username)).toBe(true);
      }
    });
  });
});
