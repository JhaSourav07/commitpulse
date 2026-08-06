import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentlyPlaying, isSpotifyConfigured } from './api';

// Mock process.env
const originalEnv = process.env;

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...originalEnv };
});

describe('Spotify API Service', () => {
  it('isSpotifyConfigured returns false if env vars are missing', () => {
    process.env.SPOTIFY_CLIENT_ID = '';
    expect(isSpotifyConfigured()).toBe(false);
  });

  it('isSpotifyConfigured returns true if env vars are present', () => {
    process.env.SPOTIFY_CLIENT_ID = 'id';
    process.env.SPOTIFY_CLIENT_SECRET = 'secret';
    process.env.SPOTIFY_REFRESH_TOKEN = 'token';
    expect(isSpotifyConfigured()).toBe(true);
  });

  it('getCurrentlyPlaying returns offline state if not configured', async () => {
    process.env.SPOTIFY_CLIENT_ID = '';
    const result = await getCurrentlyPlaying();
    expect(result.isPlaying).toBe(false);
  });

  it('getCurrentlyPlaying returns track data on success', async () => {
    process.env.SPOTIFY_CLIENT_ID = 'id';
    process.env.SPOTIFY_CLIENT_SECRET = 'secret';
    process.env.SPOTIFY_REFRESH_TOKEN = 'token';

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('token')) {
        return {
          ok: true,
          json: async () => ({ access_token: 'mock-access-token' }),
        };
      }
      if (url.includes('currently-playing')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            is_playing: true,
            currently_playing_type: 'track',
            item: {
              name: 'Test Song',
              artists: [{ name: 'Test Artist' }],
              album: { name: 'Test Album', images: [{ url: 'test-url' }] },
              external_urls: { spotify: 'spotify-url' },
              duration_ms: 200000,
            },
            progress_ms: 100000,
          }),
        };
      }
    });

    const result = await getCurrentlyPlaying();
    expect(result.isPlaying).toBe(true);
    expect(result.title).toBe('Test Song');
    expect(result.artist).toBe('Test Artist');
  });

  it('getCurrentlyPlaying handles 204 No Content gracefully', async () => {
    process.env.SPOTIFY_CLIENT_ID = 'id';
    process.env.SPOTIFY_CLIENT_SECRET = 'secret';
    process.env.SPOTIFY_REFRESH_TOKEN = 'token';

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('token')) {
        return {
          ok: true,
          json: async () => ({ access_token: 'mock-access-token' }),
        };
      }
      if (url.includes('currently-playing')) {
        return {
          ok: true,
          status: 204, // No content
        };
      }
    });

    const result = await getCurrentlyPlaying();
    expect(result.isPlaying).toBe(false);
  });
});

describe('[Bug fix] getCurrentlyPlaying — status code boundary', () => {
  beforeEach(() => {
    // Ensure environment variables are set so getCurrentlyPlaying gets past the check
    process.env.SPOTIFY_CLIENT_ID = 'id';
    process.env.SPOTIFY_CLIENT_SECRET = 'secret';
    process.env.SPOTIFY_REFRESH_TOKEN = 'token';
  });

  it('returns isPlaying: false for a 401 response without attempting to parse it as a track', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      // Allow the getAccessToken call to succeed
      if (url.includes('token')) {
        return {
          ok: true,
          json: async () => ({ access_token: 'mock-access-token' }),
        };
      }
      // Return 401 for the NOW_PLAYING endpoint
      return {
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({ error: { status: 401, message: 'The access token expired' } }),
      };
    }) as unknown as typeof fetch;

    const result = await getCurrentlyPlaying();
    expect(result).toEqual({ isPlaying: false });
  });

  it('returns isPlaying: false for a 400 response', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('token')) {
        return {
          ok: true,
          json: async () => ({ access_token: 'mock-access-token' }),
        };
      }
      return {
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: { status: 400, message: 'Bad request' } }),
      };
    }) as unknown as typeof fetch;

    const result = await getCurrentlyPlaying();
    expect(result).toEqual({ isPlaying: false });
  });

  it('still returns isPlaying: false for a 204 (nothing playing)', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('token')) {
        return {
          ok: true,
          json: async () => ({ access_token: 'mock-access-token' }),
        };
      }
      return {
        ok: true,
        status: 204,
        json: () => Promise.resolve(null),
      };
    }) as unknown as typeof fetch;

    const result = await getCurrentlyPlaying();
    expect(result).toEqual({ isPlaying: false });
  });
});
