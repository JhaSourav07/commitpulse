import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockExistsSync, mockReadFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadFileSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
  },
}));

import { isBotAuthor, getIgnoredAuthors, __resetIgnoredAuthorsCacheForTests } from '../bot-filter';

describe('Bot Filter Utility', () => {
  beforeEach(() => {
    // Reset cache before every test so mocked FS changes apply
    __resetIgnoredAuthorsCacheForTests();
    vi.clearAllMocks();
  });

  it('detects default bot names and suffixes', () => {
    expect(isBotAuthor('dependabot')).toBe(true);
    expect(isBotAuthor('renovate')).toBe(true);
    expect(isBotAuthor('renovate-bot')).toBe(true);
    expect(isBotAuthor('github-actions[bot]')).toBe(true);
    expect(isBotAuthor('some-random-user')).toBe(false);
  });

  it('detects bots case-insensitively', () => {
    expect(isBotAuthor('DependaBot')).toBe(true);
    expect(isBotAuthor('RENOVATE')).toBe(true);
    expect(isBotAuthor('Renovate-Bot')).toBe(true);
    expect(isBotAuthor('GitHub-Actions[BOT]')).toBe(true);
  });

  it('returns false for empty or null usernames', () => {
    expect(isBotAuthor('')).toBe(false);
    expect(isBotAuthor(null as unknown as string)).toBe(false);
    expect(isBotAuthor(undefined as unknown as string)).toBe(false);
  });

  it('loads config file and respects ignored_authors', () => {
    const mockConfig = JSON.stringify({
      ignored_authors: ['HumanUserA', 'john_doe'],
    });

    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(mockConfig);

    expect(getIgnoredAuthors()).toEqual(['humanusera', 'john_doe']);
    expect(isBotAuthor('HumanUserA')).toBe(true);
    expect(isBotAuthor('john_doe')).toBe(true);
    expect(isBotAuthor('humanusera')).toBe(true);
    expect(isBotAuthor('other-user')).toBe(false);
  });

  it('handles config file errors gracefully', () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockImplementation(() => {
      throw new Error('Read error');
    });

    expect(getIgnoredAuthors()).toEqual([]);
    expect(isBotAuthor('some-random-user')).toBe(false);
  });

  describe('[Bug fix] getIgnoredAuthors caching', () => {
    it('only reads the config file from disk once across multiple calls', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ ignored_authors: ['some-bot'] }));

      getIgnoredAuthors();
      getIgnoredAuthors();
      getIgnoredAuthors();

      // Verifies the file system is only hit once
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    });

    it('returns the same cached result on subsequent calls', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ ignored_authors: ['bot-one'] }));

      const first = getIgnoredAuthors();
      const second = getIgnoredAuthors();

      expect(first).toEqual(['bot-one']);
      expect(second).toBe(first); // same array reference, confirming cache reuse
    });
  });
});
