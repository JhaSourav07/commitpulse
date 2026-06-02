import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContributorsPage from './page';
import '@testing-library/jest-dom';

describe('ContributorsPage - Timezone Boundaries & Calendar Alignment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('verifies standard timestamp formatting in rate limit message', async () => {
    const timestamp = 1704067200; // 2024-01-01T00:00:00.000Z
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 403,
        headers: {
          get: (name: string) => {
            if (name === 'x-ratelimit-remaining') return '0';
            if (name === 'x-ratelimit-reset') return String(timestamp);
            return null;
          },
        },
        json: async () => [],
      })
    ) as unknown as typeof fetch;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const element = await ContributorsPage();
    // Element renders fallback UI because of the API rate limit error, fetch fails gracefully
    expect(element).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch contributors:',
      expect.objectContaining({
        message: expect.stringContaining('Please try again after 2024-01-01T00:00:00.000Z.'),
      })
    );
  });

  it('verifies timezone/calendar alignment during leap year boundaries', async () => {
    const timestamp = 1709164800; // 2024-02-29T00:00:00.000Z (Leap day)
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 403,
        headers: {
          get: (name: string) => {
            if (name === 'x-ratelimit-remaining') return '0';
            if (name === 'x-ratelimit-reset') return String(timestamp);
            return null;
          },
        },
        json: async () => [],
      })
    ) as unknown as typeof fetch;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await ContributorsPage();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch contributors:',
      expect.objectContaining({
        message: expect.stringContaining('Please try again after 2024-02-29T00:00:00.000Z.'),
      })
    );
  });

  it('verifies timezone/calendar alignment during year-end boundary rollovers', async () => {
    const timestamp = 1798761599; // 2026-12-31T23:59:59.000Z
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 403,
        headers: {
          get: (name: string) => {
            if (name === 'x-ratelimit-remaining') return '0';
            if (name === 'x-ratelimit-reset') return String(timestamp);
            return null;
          },
        },
        json: async () => [],
      })
    ) as unknown as typeof fetch;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await ContributorsPage();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch contributors:',
      expect.objectContaining({
        message: expect.stringContaining('Please try again after 2026-12-31T23:59:59.000Z.'),
      })
    );
  });

  it('handles invalid non-numeric or empty rate limit reset headers gracefully without throwing formatter exceptions', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        headers: {
          get: (name: string) => {
            if (name === 'x-ratelimit-reset') return 'invalid-timestamp';
            return null;
          },
        },
        json: async () => [],
      })
    ) as unknown as typeof fetch;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await ContributorsPage();
    // It should omit the date reset message entirely when timestamp is invalid
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch contributors:',
      expect.objectContaining({
        message: 'GitHub API rate limit exceeded. Please try again later.',
      })
    );
  });
});
