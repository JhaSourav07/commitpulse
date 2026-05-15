import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest): Promise<ImageResponse> {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get('user') ?? 'unknown';

  // Fetch streak stats
  let totalCommits = 0;
  let longestStreak = 0;
  let currentStreak = 0;

  try {
    const baseUrl = req.nextUrl.origin;
    const res = await fetch(
      `${baseUrl}/api/streak?user=${user}&refresh=true`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json();
      totalCommits = data.totalContributions ?? 0;
      longestStreak = data.longestStreak ?? 0;
      currentStreak = data.currentStreak ?? 0;
    }
  } catch {
    // Fallback to zeros if fetch fails
  }

  return new ImageResponse(
    (
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
        {/* Glow effect */}
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

        {/* Logo + Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              color: '#58a6ff',
              fontWeight: 'bold',
              letterSpacing: '-1px',
            }}
          >
            ⚡ CommitPulse
          </div>
        </div>

        {/* Username */}
        <div
          style={{
            fontSize: '32px',
            color: '#c9d1d9',
            marginBottom: '48px',
            opacity: 0.8,
          }}
        >
          @{user}
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'flex',
            gap: '48px',
          }}
        >
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
            <div
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: '#58a6ff',
              }}
            >
              {totalCommits}
            </div>
            <div style={{ fontSize: '18px', color: '#8b949e', marginTop: '8px' }}>
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
            <div
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: '#f78166',
              }}
            >
              {longestStreak}
            </div>
            <div style={{ fontSize: '18px', color: '#8b949e', marginTop: '8px' }}>
              Longest Streak 🔥
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
            <div
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: '#3fb950',
              }}
            >
              {currentStreak}
            </div>
            <div style={{ fontSize: '18px', color: '#8b949e', marginTop: '8px' }}>
              Current Streak ⚡
            </div>
          </div>
        </div>

        {/* Footer */}
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
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}            height={104}
            style={{ borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)' }}
            alt={name}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ color: '#ffffff', fontSize: '40px', fontWeight: 700, lineHeight: 1 }}>
              {name}
            </span>
            <span style={{ color: '#A1A1AA', fontSize: '20px', fontWeight: 400 }}>@{username}</span>
            {bio && (
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', marginTop: '2px' }}>
                {bio}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: '1px',
            background: 'rgba(255,255,255,0.08)',
          }}
        />

        {/* Stats */}
        <div style={{ display: 'flex', gap: '56px', alignItems: 'center' }}>
          {[
            { value: repos, label: 'Repositories' },
            { value: followers, label: 'Followers' },
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '56px' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{ fontSize: '52px', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}
                >
                  {stat.value.toLocaleString()}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: '#A1A1AA',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                  }}
                >
                  {stat.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div
                  style={{ width: '1px', height: '56px', background: 'rgba(255,255,255,0.08)' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Branding */}
      <div
        style={{
          position: 'absolute',
          bottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}
        >
          commitpulse.vercel.app
        </span>
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
