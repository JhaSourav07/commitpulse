// app/api/og/route.tsx

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { ogParamsSchema } from '@/lib/validations';
import { themes } from '@/lib/svg/themes';
import { fetchGitHubContributions } from '@/lib/github';
import { calculateStreak } from '@/lib/calculate';

const appUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://commitpulse.vercel.app');

const displayDomain = (() => {
  try {
    return new URL(appUrl).host;
  } catch {
    return 'commitpulse.vercel.app';
  }
})();

function getLuminance(hex: string) {
  let normalizedHex = hex.trim();
  // Normalize short hex (e.g., #fff or #ffff) to #rrggbb (alpha is ignored for luminance)
  if (normalizedHex.length === 4 || normalizedHex.length === 5) {
    normalizedHex = `#${normalizedHex[1]}${normalizedHex[1]}${normalizedHex[2]}${normalizedHex[2]}${normalizedHex[3]}${normalizedHex[3]}`;
  }
  const r = parseInt(normalizedHex.slice(1, 3), 16) / 255 || 0;
  const g = parseInt(normalizedHex.slice(3, 5), 16) / 255 || 0;
  const b = parseInt(normalizedHex.slice(5, 7), 16) / 255 || 0;

  const [R, G, B] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const { user, theme, bg, text, accent } = ogParamsSchema.parse(
    Object.fromEntries(searchParams.entries())
  );

  const selectedTheme = themes[theme] || themes.dark;
  const resolvedBg = `#${bg || selectedTheme.bg}`;
  const resolvedText = `#${text || selectedTheme.text}`;
  const resolvedAccent = `#${accent || selectedTheme.accent}`;

  const luminance = getLuminance(resolvedBg);
  const isLight = luminance > 0.5;
  const cardBg = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)';
  const subText = isLight ? '#666666' : '#8b949e';

  let totalCommits = 0;
  let longestStreak = 0;
  let currentStreak = 0;

  // Only the data fetching is wrapped in try/catch — not the JSX rendering.
  try {
    const calendar = await fetchGitHubContributions(user, { bypassCache: true });
    const stats = calculateStreak(calendar);
    totalCommits = stats.totalContributions;
    longestStreak = stats.longestStreak;
    currentStreak = stats.currentStreak;
  } catch (err) {
    console.error('[OG] stats fetch failed:', err);
    // fallback to zeros if GitHub is unreachable
  }

  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        background: resolvedBg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '300px',
          background: `radial-gradient(ellipse, ${resolvedAccent}33 0%, transparent 70%)`,
          top: '50px',
          left: '300px',
          display: 'flex',
        }}
      />
      <div
        style={{
          display: 'flex',
          fontSize: '48px',
          color: resolvedAccent,
          fontWeight: 'bold',
          marginBottom: '24px',
        }}
      >
        {'⚡ CommitPulse'}
      </div>
      <div style={{ display: 'flex', fontSize: '32px', color: resolvedText, marginBottom: '48px' }}>
        {`@${user}`}
      </div>
      <div style={{ display: 'flex', gap: '48px' }}>
        {/* Total Commits */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '16px',
            padding: '32px 48px',
          }}
        >
          <div
            style={{ display: 'flex', fontSize: '56px', fontWeight: 'bold', color: resolvedAccent }}
          >
            {String(totalCommits)}
          </div>
          <div style={{ display: 'flex', fontSize: '18px', color: subText, marginTop: '8px' }}>
            Total Commits
          </div>
        </div>
        {/* Longest Streak */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '16px',
            padding: '32px 48px',
          }}
        >
          <div
            style={{ display: 'flex', fontSize: '56px', fontWeight: 'bold', color: resolvedAccent }}
          >
            {String(longestStreak)}
          </div>
          <div style={{ display: 'flex', fontSize: '18px', color: subText, marginTop: '8px' }}>
            {'Longest Streak 🔥'}
          </div>
        </div>
        {/* Current Streak */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '16px',
            padding: '32px 48px',
          }}
        >
          <div
            style={{ display: 'flex', fontSize: '56px', fontWeight: 'bold', color: resolvedAccent }}
          >
            {String(currentStreak)}
          </div>
          <div style={{ display: 'flex', fontSize: '18px', color: subText, marginTop: '8px' }}>
            {'Current Streak ⚡'}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          bottom: '32px',
          fontSize: '16px',
          color: subText,
        }}
      >
        {displayDomain}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    }
  );
}
