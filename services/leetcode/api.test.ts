import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLeetCodeStats } from './api';

describe('getLeetCodeStats', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns error when username is empty', async () => {
    const res = await getLeetCodeStats('');
    expect(res.error).toBe('Username is required');
    expect(res.totalSolved).toBe(0);
  });

  it('fetches and parses LeetCode stats successfully', async () => {
    const mockData = {
      data: {
        matchedUser: {
          username: 'testuser',
          submitStats: {
            acSubmissionNum: [
              { difficulty: 'All', count: 350 },
              { difficulty: 'Easy', count: 150 },
              { difficulty: 'Medium', count: 150 },
              { difficulty: 'Hard', count: 50 },
            ],
          },
          profile: {
            ranking: 12345,
          },
        },
      },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })
    );

    const res = await getLeetCodeStats('testuser');
    expect(res.username).toBe('testuser');
    expect(res.totalSolved).toBe(350);
    expect(res.easySolved).toBe(150);
    expect(res.mediumSolved).toBe(150);
    expect(res.hardSolved).toBe(50);
    expect(res.ranking).toBe(12345);
    expect(res.error).toBeUndefined();
  });

  it('handles user not found error response', async () => {
    const mockData = {
      data: {
        matchedUser: null,
      },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      })
    );

    const res = await getLeetCodeStats('nonexistentuser');
    expect(res.error).toBe('User not found');
    expect(res.totalSolved).toBe(0);
  });

  it('handles non-200 HTTP response status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    );

    const res = await getLeetCodeStats('someuser');
    expect(res.error).toBe('LeetCode API error (500)');
  });

  it('handles network failure gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));

    const res = await getLeetCodeStats('someuser');
    expect(res.error).toBe('Failed to fetch LeetCode data');
  });
});
