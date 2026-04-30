import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getFullDashboardData } from '@/lib/github';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') ?? 'ghost';

  let name = username;
  let avatarUrl = `https://github.com/${username}.png`;
  let currentStreak = 0;
  let totalContributions = 0;
  let developerScore = 0;
  let bio = '';

  try {
    const data = await getFullDashboardData(username);
    name = data.profile.name || username;
    avatarUrl = data.profile.avatarUrl;
    currentStreak = data.stats.currentStreak;
    totalContributions = data.stats.totalContributions;
    developerScore = data.profile.developerScore;
    bio = data.profile.bio?.slice(0, 80) ?? '';
  } catch {
    // fallback to defaults above
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #050505 0%, #0d0d1a 50%, #050510 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background blobs */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)',
          }}
        />

        {/* Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            padding: '60px 80px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '28px',
            width: '900px',
          }}
        >
          {/* Avatar + name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              width={110}
              height={110}
              style={{
                borderRadius: '50%',
                border: '3px solid rgba(6,182,212,0.6)',
              }}
              alt={name}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ color: '#ffffff', fontSize: '38px', fontWeight: 700, lineHeight: 1 }}>
                {name}
              </span>
              <span style={{ color: '#22d3ee', fontSize: '20px', fontWeight: 500 }}>
                @{username}
              </span>
              {bio && (
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '15px', marginTop: '4px' }}>
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
              background: 'linear-gradient(to right, transparent, rgba(6,182,212,0.4), rgba(168,85,247,0.4), transparent)',
            }}
          />

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
            {/* Streak */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '56px', fontWeight: 800, color: '#22d3ee', lineHeight: 1 }}>
                {currentStreak}
              </span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Current Streak
              </span>
            </div>

            <div style={{ width: '1px', height: '60px', background: 'rgba(255,255,255,0.08)' }} />

            {/* Contributions */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '56px', fontWeight: 800, color: '#a855f7', lineHeight: 1 }}>
                {totalContributions.toLocaleString()}
              </span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Contributions
              </span>
            </div>

            <div style={{ width: '1px', height: '60px', background: 'rgba(255,255,255,0.08)' }} />

            {/* Dev Score */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '56px', fontWeight: 800, color: '#ec4899', lineHeight: 1 }}>
                {developerScore}
              </span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Dev Score
              </span>
            </div>
          </div>
        </div>

        {/* CommitPulse branding */}
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
              fontSize: '15px',
              color: 'rgba(255,255,255,0.3)',
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
    }
  );
}
