import type { SpotifyTrackData } from '../../services/spotify/api';
import type { SpotifyParams } from '../validations';
import { getNormalizedThemeKey, themes } from './themes';
import { escapeXML } from './sanitizer';
import { DEFAULT_FONTS_BASE64 } from './fonts';

export function getSpotifyTheme(params: SpotifyParams) {
  const themeKey = getNormalizedThemeKey(params.theme);
  const selectedTheme = themes[themeKey] || themes.dark;

  return {
    bg: params.bg || selectedTheme.bg,
    text: params.text || selectedTheme.text,
    accent: params.accent || selectedTheme.accent,
  };
}

export async function generateSpotifySVG(
  track: SpotifyTrackData,
  params: SpotifyParams,
  imageBase64: string | null
): Promise<string> {
  const theme = getSpotifyTheme(params);

  const bg = theme.bg.startsWith('#') ? theme.bg : `#${theme.bg}`;
  const text = theme.text.startsWith('#') ? theme.text : `#${theme.text}`;
  const accent = Array.isArray(theme.accent) ? theme.accent[0] : theme.accent;
  const accentHex = accent.startsWith('#') ? accent : `#${accent}`;

  const width = params.width || 400;
  const height = params.height || 150;
  const radius = params.radius !== undefined ? params.radius : 8;

  const title = track.isPlaying
    ? escapeXML(track.title || 'Unknown Title')
    : 'Not Currently Playing';
  const artist = track.isPlaying ? escapeXML(track.artist || 'Unknown Artist') : 'Spotify';

  // Truncate long texts
  const displayTitle = title.length > 35 ? title.substring(0, 32) + '...' : title;
  const displayArtist = artist.length > 40 ? artist.substring(0, 37) + '...' : artist;

  const progressPercent =
    track.isPlaying && track.durationMs && track.progressMs
      ? Math.min(100, (track.progressMs / track.durationMs) * 100)
      : 0;

  // The Spotify Logo (Monochrome or colored)
  const spotifyLogo = `
    <g transform="translate(${width - 40}, 20) scale(0.6)">
      <path fill="${accentHex}" d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm7.349 23.159c-.3.493-.933.646-1.428.347-3.908-2.387-8.824-2.924-14.619-1.602-.544.124-1.077-.216-1.201-.76-.124-.544.216-1.077.76-1.201 6.273-1.433 11.716-.838 16.141 1.867.495.3.649.932.347 1.428zm1.96-4.372c-.378.614-1.168.809-1.78.431-4.478-2.753-11.332-3.575-16.326-1.956-.704.228-1.448-.158-1.676-.861-.228-.704.158-1.448.861-1.676 5.76-1.868 13.333-1.006 18.49 2.167.613.377.808 1.166.431 1.78zm.135-4.57c-5.362-3.18-14.195-3.473-19.303-1.923-.836.255-1.722-.218-1.977-1.054-.255-.836.218-1.722 1.054-1.977 5.918-1.796 15.684-1.455 21.895 2.228.756.449.999 1.417.551 2.172-.448.756-1.417.999-2.172.551z"/>
    </g>`;

  // Animated EQ Bars
  const eqBars = track.isPlaying
    ? `
    <g transform="translate(130, 95)">
      <rect x="0" y="0" width="4" height="15" fill="${accentHex}">
        <animate attributeName="height" values="5;15;5" dur="1s" repeatCount="indefinite" />
        <animate attributeName="y" values="10;0;10" dur="1s" repeatCount="indefinite" />
      </rect>
      <rect x="7" y="0" width="4" height="15" fill="${accentHex}">
        <animate attributeName="height" values="15;5;15" dur="0.8s" repeatCount="indefinite" />
        <animate attributeName="y" values="0;10;0" dur="0.8s" repeatCount="indefinite" />
      </rect>
      <rect x="14" y="0" width="4" height="15" fill="${accentHex}">
        <animate attributeName="height" values="5;10;5" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="y" values="10;5;10" dur="1.2s" repeatCount="indefinite" />
      </rect>
    </g>
  `
    : '';

  // Album Art / Placeholder
  let coverImage = '';
  if (imageBase64) {
    coverImage = `
      <defs>
        <clipPath id="album-clip">
          <rect x="30" y="35" width="80" height="80" rx="8" />
        </clipPath>
      </defs>
      <image x="30" y="35" width="80" height="80" href="${imageBase64}" clip-path="url(#album-clip)" preserveAspectRatio="xMidYMid slice" />
    `;
  } else {
    // Placeholder (gray box with musical note or similar)
    coverImage = `
      <rect x="30" y="35" width="80" height="80" rx="8" fill="${text}" fill-opacity="0.1" />
      <path d="M75.5 50.5C75.5 53.5376 73.0376 56 70 56C66.9624 56 64.5 53.5376 64.5 50.5C64.5 47.4624 66.9624 45 70 45C72.637 45 74.8465 46.8524 75.3789 49.3333L75.5 49.3333V49.5L75.5 49.3333V49.1667V37L83.5 35V45.5C83.5 48.5376 81.0376 51 78 51C74.9624 51 72.5 48.5376 72.5 45.5C72.5 42.4624 74.9624 40 78 40C80.637 40 82.8465 41.8524 83.3789 44.3333L83.5 44.3333V44.5L83.5 44.3333V33.1667L73.5 35.6667V49.3333V49.5L75.5 49.5V50.5Z" fill="${text}" fill-opacity="0.3"/>
    `;
  }

  // Progress Bar
  const progressBar = track.isPlaying
    ? `
    <g transform="translate(130, 115)">
      <rect x="0" y="0" width="${width - 170}" height="4" rx="2" fill="${text}" fill-opacity="0.2" />
      <rect x="0" y="0" width="${((width - 170) * progressPercent) / 100}" height="4" rx="2" fill="${accentHex}" />
    </g>
  `
    : '';

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        ${DEFAULT_FONTS_BASE64}
        .title {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 16px;
          fill: ${text};
        }
        .artist {
          font-family: 'Inter', 'Roboto', sans-serif;
          font-weight: 400;
          font-size: 13px;
          fill: ${text};
          opacity: 0.8;
        }
      </style>
      <rect x="0.5" y="0.5" rx="${radius}" width="100%" height="100%" fill="${bg}" />
      ${coverImage}
      ${spotifyLogo}
      <text x="130" y="55" class="title">${displayTitle}</text>
      <text x="130" y="75" class="artist">${displayArtist}</text>
      ${eqBars}
      ${progressBar}
    </svg>
  `.trim();
}
