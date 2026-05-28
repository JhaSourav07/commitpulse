import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { ogParamsSchema } from '../../../lib/validations';
import { fetchGitHubContributions } from '../../../lib/github';
import { calculateStreak } from '../../../lib/calculate';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const { user } = ogParamsSchema.parse(Object.fromEntries(searchParams.entries()));

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
        background: '#0d1117',
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
          background: 'radial-gradient(ellipse, #58a6ff22 0%, transparent 70%)',
          top: '50px',
          left: '300px',
          display: 'flex',
        }}
      />
      <div
        style={{
          display: 'flex',
          fontSize: '48px',
          color: '#58a6ff',
          fontWeight: 'bold',
          marginBottom: '24px',
        }}
      >
        {'⚡ CommitPulse'}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: '32px',
          color: '#c9d1d9',
          marginBottom: '48px',
        }}
      >
        {`@${user}`}
      </div>
      <div style={{ display: 'flex', gap: '48px' }}>
        {/* Total Commits */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '16px',
            padding: '32px 48px',
          }}
        >
          <div style={{ display: 'flex', fontSize: '56px', fontWeight: 'bold', color: '#58a6ff' }}>
            {String(totalCommits)}
          </div>
          <div style={{ display: 'flex', fontSize: '18px', color: '#8b949e', marginTop: '8px' }}>
            Total Commits
          </div>
        </div>
        {/* Longest Streak */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '16px',
            padding: '32px 48px',
          }}
        >
          <div style={{ display: 'flex', fontSize: '56px', fontWeight: 'bold', color: '#f78166' }}>
            {String(longestStreak)}
          </div>
          <div style={{ display: 'flex', fontSize: '18px', color: '#8b949e', marginTop: '8px' }}>
            {'Longest Streak 🔥'}
          </div>
        </div>
        {/* Current Streak */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '16px',
            padding: '32px 48px',
          }}
        >
          <div style={{ display: 'flex', fontSize: '56px', fontWeight: 'bold', color: '#3fb950' }}>
            {String(currentStreak)}
          </div>
          <div style={{ display: 'flex', fontSize: '18px', color: '#8b949e', marginTop: '8px' }}>
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
          color: '#484f58',
        }}
      >
        commitpulse.vercel.app
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
