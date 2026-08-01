// services/spotify/api.ts

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

export interface SpotifyTrackData {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
  progressMs?: number;
  durationMs?: number;
}

export function isSpotifyConfigured(): boolean {
  return !!(
    process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET &&
    process.env.SPOTIFY_REFRESH_TOKEN
  );
}

/**
 * Get a new access token using the refresh token
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
    // Cache access token for 1 hour to reduce Spotify Token API requests
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
 * Fetch the user's currently playing track from Spotify
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
      // Do not cache this request natively, we'll cache it at the route level
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
      // Could be a podcast episode, currently unsupported
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
