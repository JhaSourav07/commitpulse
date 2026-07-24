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

import { isBotAuthor, getIgnoredAuthors } from '../bot-filter';

describe('Bot Filter Utility', () => {
  beforeEach(() => {
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
});
