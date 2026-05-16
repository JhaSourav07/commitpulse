import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get('user') ?? 'unknown';

  let totalCommits = 0;
  let longestStreak = 0;
  let currentStreak = 0;

  try {
    const baseUrl = req.nextUrl.origin;

    const res = await fetch(`${baseUrl}/api/streak?user=${user}&refresh=true`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const data = (await res.json()) as {
        totalContributions?: number;
        longestStreak?: number;
        currentStreak?: number;
      };

      totalCommits = data.totalContributions ?? 0;
      longestStreak = data.longestStreak ?? 0;
      currentStreak = data.currentStreak ?? 0;
    }
  } catch {
    // fallback
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
        }}
      />

      <div
        style={{
          fontSize: '48px',
          color: '#58a6ff',
          fontWeight: 'bold',
          marginBottom: '24px',
        }}
      >
        ⚡ CommitPulse
      </div>

      <div
        style={{
          fontSize: '32px',
          color: '#c9d1d9',
          marginBottom: '48px',
        }}
      >
        @{user}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '48px',
        }}
      >
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
          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#58a6ff',
            }}
          >
            {totalCommits}
          </div>

          <div
            style={{
              fontSize: '18px',
              color: '#8b949e',
              marginTop: '8px',
            }}
          >
            Total Commits
          </div>
        </div>

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
          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#f78166',
            }}
          >
            {longestStreak}
          </div>

          <div
            style={{
              fontSize: '18px',
              color: '#8b949e',
              marginTop: '8px',
            }}
          >
            Longest Streak 🔥
          </div>
        </div>

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
          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#3fb950',
            }}
          >
            {currentStreak}
          </div>

          <div
            style={{
              fontSize: '18px',
              color: '#8b949e',
              marginTop: '8px',
            }}
          >
            Current Streak ⚡
          </div>
        </div>
      </div>

      <div
        style={{
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
