import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

// Must be Edge runtime — Vercel's OG image generation requires it,
// and it's much faster than Node (no cold-start overhead).
export const runtime = 'edge';

// X/Twitter crawlers have a ~5 s hard timeout.
// We use the lightweight REST endpoint (no GraphQL, no rate-limit headers)
// and fall back gracefully so the image always renders.
async function fetchUserFast(username: string) {
  const headers: HeadersInit = { Accept: 'application/vnd.github+json' };
  const pat = process.env.GITHUB_PAT;
  if (pat) headers.Authorization = `Bearer ${pat}`;

  const res = await fetch(`https://api.github.com/users/${username}`, {
    headers,
    // next: { revalidate: 3600 }, // not supported on edge — use Cache-Control header instead
  });

  if (!res.ok) return null;
  return res.json() as Promise<{
    name: string | null;
    login: string;
    avatar_url: string;
    bio: string | null;
    public_repos: number;
    followers: number;
  }>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') ?? 'ghost';

  // Fetch with a hard 4 s budget so we never exceed X's timeout
  const user = await Promise.race([
    fetchUserFast(username),
    new Promise<null>((res) => setTimeout(() => res(null), 4000)),
  ]);

  const name        = user?.name  || username;
  const avatarUrl   = user?.avatar_url ?? `https://github.com/${username}.png`;
  const bio         = (user?.bio ?? '').slice(0, 90);
  const repos       = user?.public_repos ?? 0;
  const followers   = user?.followers ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle top border glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'rgba(255,255,255,0.12)',
          }}
        />

        {/* Faint radial glow behind card */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '28px',
            padding: '56px 80px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '24px',
            width: '920px',
          }}
        >
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              width={104}
              height={104}
              style={{ borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)' }}
              alt={name}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: '#ffffff', fontSize: '40px', fontWeight: 700, lineHeight: 1 }}>
                {name}
              </span>
              <span style={{ color: '#A1A1AA', fontSize: '20px', fontWeight: 400 }}>
                @{username}
              </span>
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
              { value: repos,     label: 'Repositories' },
              { value: followers, label: 'Followers'     },
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
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    }
  );
}
