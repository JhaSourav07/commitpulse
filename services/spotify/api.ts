/**
 * Spotify integration — currently playing track fetching.
 *
 * Uses the Spotify Web API to retrieve the authenticated user's currently
 * playing track. Requires `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and
 * `SPOTIFY_REFRESH_TOKEN` environment variables to be set.
 *
 * Note: Only tracks (not podcasts / episodes) are supported. Any other
 * `currently_playing_type` results in `isPlaying: false`.
 */

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

/**
 * Represents the currently playing Spotify track, or a stopped/idle state.
 *
 * All fields except `isPlaying` are optional because they are only populated
 * when a track is actively playing. The caller should always check
 * `isPlaying` first.
 */
export interface SpotifyTrackData {
  /**
   * `true` when a track is currently playing; `false` when nothing is
   * playing, Spotify is not configured, or an error occurred.
   */
  isPlaying: boolean;
  /** The track title. Undefined when nothing is playing. */
  title?: string;
  /** Comma-separated artist names. Undefined when nothing is playing. */
  artist?: string;
  /** The album name. Undefined when nothing is playing. */
  album?: string;
  /** URL of the album's cover art (highest resolution available). Undefined when nothing is playing. */
  albumImageUrl?: string;
  /** Direct link to the track on Spotify. Undefined when nothing is playing. */
  songUrl?: string;
  /**
   * Playback position in milliseconds at the time of the API response.
   * Useful for rendering a progress indicator. Undefined when nothing is playing.
   */
  progressMs?: number;
  /**
   * Total track duration in milliseconds.
   * Useful for rendering a progress indicator. Undefined when nothing is playing.
   */
  durationMs?: number;
}

/**
 * Checks whether all required Spotify environment variables are present.
 *
 * Call this before making any API requests to avoid a descriptive error from
 * `getAccessToken`. Alternatively, `getCurrentlyPlaying` handles the
 * unconfigured case by returning `{ isPlaying: false }`.
 *
 * @returns `true` when `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and
 *   `SPOTIFY_REFRESH_TOKEN` are all set; `false` otherwise.
 */
export function isSpotifyConfigured(): boolean {
  return !!(
    process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET &&
    process.env.SPOTIFY_REFRESH_TOKEN
  );
}

/**
 * Obtains a fresh Spotify API access token using the stored refresh token.
 *
 * Uses the client credentials OAuth flow with a refresh token grant.
 * The result is cached by Next.js for 3500 seconds (~58 minutes) via the
 * `next: { revalidate: 3500 }` fetch option to avoid hitting the token
 * endpoint on every request.
 *
 * @returns The raw Spotify access token string.
 * @throws Error with message `'Spotify is not configured. Missing environment variables.'`
 *   when one or more required env vars are absent.
 * @throws Error with message `'Failed to refresh Spotify token: <response body>'`
 *   when the Spotify API returns a non-OK response.
 */
export async function getAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Spotify is not configured. Missing environment variables.');
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    // Cache access token for ~58 minutes to reduce Spotify Token API requests
    next: { revalidate: 3500 },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to refresh Spotify token: ${errorData}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetches the authenticated user's currently playing Spotify track.
 *
 * Returns `{ isPlaying: false }` in the following cases:
 * - Spotify is not configured (`isSpotifyConfigured()` returns `false`).
 * - The user has nothing currently playing (HTTP 204).
 * - The Spotify API returns an error status (> 400).
 * - The currently playing item is not a track (e.g. a podcast episode).
 * - Any network or parsing error occurs.
 *
 * The response is never cached natively (`cache: 'no-store'`) — callers
 * should apply their own caching strategy at the route level if needed.
 *
 * @returns A `Promise<SpotifyTrackData>` describing the current track, or
 *   `{ isPlaying: false }` when playback is unavailable.
 */
export async function getCurrentlyPlaying(): Promise<SpotifyTrackData> {
  if (!isSpotifyConfigured()) {
    return { isPlaying: false };
  }

  try {
    const access_token = await getAccessToken();

    const response = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      // Do not cache this request natively; apply caching at the route level instead
      cache: 'no-store',
    });

    if (response.status === 204 || response.status > 400) {
      return { isPlaying: false };
    }

    const data = await response.json();

    if (!data || !data.item) {
      return { isPlaying: false };
    }

    if (data.currently_playing_type !== 'track') {
      // Could be a podcast episode — currently unsupported
      return { isPlaying: false };
    }

    const title = data.item.name;
    const artist = data.item.artists.map((_artist: { name: string }) => _artist.name).join(', ');
    const album = data.item.album.name;
    const albumImageUrl = data.item.album.images[0]?.url;
    const songUrl = data.item.external_urls.spotify;
    const isPlaying = data.is_playing;
    const progressMs = data.progress_ms;
    const durationMs = data.item.duration_ms;

    return {
      isPlaying,
      title,
      artist,
      album,
      albumImageUrl,
      songUrl,
      progressMs,
      durationMs,
    };
  } catch (error) {
    console.warn('Error fetching currently playing track from Spotify:', error);
    return { isPlaying: false };
  }
}
