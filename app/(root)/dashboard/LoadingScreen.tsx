'use client';

import { useEffect, useState } from 'react';

// Total animation duration in ms:
//   0.3s begin-delay + 2.8s orb travel + 0.4s exit fade = 3500ms
export const ANIMATION_MS = 3100;
export const FADE_OUT_MS = 400;
export const TOTAL_MS = ANIMATION_MS + FADE_OUT_MS; // 3500ms

interface LoadingScreenProps {
  /** Called once the fade-out finishes and the overlay has fully gone. */
  onComplete?: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps = {}) {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible');

  // Lazy initializer — runs once on first render, after hydration, so the DOM
  // is available. No effect needed; avoids the set-state-in-effect lint rule.
  const [isDark] = useState<boolean>(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  // All colours derived from theme
  const bg = isDark ? '#000000' : '#ffffff';
  const strokeBase = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const strokeTrail = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';
  const orbFill = isDark ? 'white' : 'black';
  const orbHalo1 = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const orbHalo2 = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
  const wordColor = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)';
  const tagColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)';
  const dotColor = isDark ? 'bg-white' : 'bg-black';
  const vigColor = isDark
    ? 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,255,255,0.015) 0%, transparent 80%)'
    : 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.015) 0%, transparent 80%)';

  useEffect(() => {
    const animTimer = setTimeout(() => setPhase('fading'), ANIMATION_MS);
    const goneTimer = setTimeout(() => {
      setPhase('gone');
      onComplete?.();
    }, TOTAL_MS);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(goneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fully unmounted — yields the screen to the real page
  if (phase === 'gone') return null;

  return (
    <>
      <style>{`
        @keyframes screen-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes screen-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes path-appear {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes trail-draw {
          0%   { stroke-dashoffset: 2200; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes word-rise {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0px); }
        }
        @keyframes dot-beat {
          0%, 100% { opacity: 0.15; transform: scale(0.7); }
          50%       { opacity: 1;    transform: scale(1.1); }
        }

        .ls-root-visible {
          animation: screen-in 0.4s ease forwards;
        }
        .ls-root-fading {
          animation: screen-out ${FADE_OUT_MS}ms ease forwards;
        }
        .ls-base-path {
          animation: path-appear 0.6s ease 0.1s both;
        }
        .ls-trail-path {
          stroke-dasharray: 2200;
          stroke-dashoffset: 2200;
          animation: trail-draw 2.8s cubic-bezier(0.4, 0, 0.55, 1) 0.3s forwards;
        }
        .ls-wordmark {
          animation: word-rise 0.7s cubic-bezier(0.22,1,0.36,1) 1.2s both;
        }
        .ls-dot { animation: dot-beat 1.5s ease-in-out infinite; }
        .ls-dot:nth-child(2) { animation-delay: 0.22s; }
        .ls-dot:nth-child(3) { animation-delay: 0.44s; }
      `}</style>

      <div
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden ${
          phase === 'fading' ? 'ls-root-fading' : 'ls-root-visible'
        }`}
        style={{ backgroundColor: bg }}
      >
        {/* Subtle centre vignette */}
        <div className="pointer-events-none absolute inset-0" style={{ background: vigColor }} />

        <div className="relative flex flex-col items-center gap-8 w-full px-6 select-none">
          {/* ══════════════════════════════════════
              ECG SVG
          ══════════════════════════════════════ */}
          <div className="w-full" style={{ maxWidth: '880px' }}>
            <svg
              viewBox="0 0 1024 560"
              width="100%"
              xmlns="http://www.w3.org/2000/svg"
              overflow="visible"
            >
              <defs>
                <filter id="ls-orb-glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="14" result="blur1" />
                  <feGaussianBlur stdDeviation="5" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur1" />
                    <feMergeNode in="blur2" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="ls-trail-glow" x="-20%" y="-100%" width="140%" height="300%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <clipPath id="ls-vbox-clip">
                  <rect x="-60" y="-60" width="1144" height="680" />
                </clipPath>
              </defs>

              {/* Dim unlit base path */}
              <path
                className="ls-base-path"
                d="M 80 290 L 329 290 L 385 210 L 465 80 L 544 480 L 623 290 L 679 290 L 747 193 L 826 358 L 944 290"
                fill="none"
                stroke={strokeBase}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Lit trail drawn by the orb */}
              <path
                className="ls-trail-path"
                d="M 80 290 L 329 290 L 385 210 L 465 80 L 544 480 L 623 290 L 679 290 L 747 193 L 826 358 L 944 290"
                fill="none"
                stroke={strokeTrail}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#ls-trail-glow)"
              />

              {/* Orb group */}
              <g clipPath="url(#ls-vbox-clip)">
                {/* Outer halo */}
                <circle r="0" fill={orbHalo1} filter="url(#ls-orb-glow)">
                  <animateMotion
                    dur="2.8s"
                    begin="0.3s"
                    fill="freeze"
                    calcMode="spline"
                    keyPoints="0;0.14;0.2;0.28;0.38;0.5;0.58;0.66;0.74;0.84;1"
                    keyTimes="0;0.14;0.2;0.28;0.38;0.5;0.58;0.66;0.74;0.84;1"
                    keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"
                    path="M 80 290 L 329 290 L 385 210 L 465 80 L 544 480 L 623 290 L 679 290 L 747 193 L 826 358 L 944 290"
                  />
                  <animate
                    attributeName="r"
                    values="22;22;42;62;62;42;22;42;42;22;22"
                    keyTimes="0;0.14;0.28;0.38;0.5;0.58;0.66;0.74;0.84;0.92;1"
                    dur="2.8s"
                    begin="0.3s"
                    fill="freeze"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.12;0.12;0.2;0.35;0.35;0.2;0.12;0.2;0.2;0.12;0.1"
                    keyTimes="0;0.14;0.28;0.38;0.5;0.58;0.66;0.74;0.84;0.92;1"
                    dur="2.8s"
                    begin="0.3s"
                    fill="freeze"
                  />
                </circle>

                {/* Mid halo */}
                <circle r="0" fill={orbHalo2} filter="url(#ls-orb-glow)">
                  <animateMotion
                    dur="2.8s"
                    begin="0.3s"
                    fill="freeze"
                    calcMode="spline"
                    keyPoints="0;0.14;0.2;0.28;0.38;0.5;0.58;0.66;0.74;0.84;1"
                    keyTimes="0;0.14;0.2;0.28;0.38;0.5;0.58;0.66;0.74;0.84;1"
                    keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"
                    path="M 80 290 L 329 290 L 385 210 L 465 80 L 544 480 L 623 290 L 679 290 L 747 193 L 826 358 L 944 290"
                  />
                  <animate
                    attributeName="r"
                    values="10;10;18;28;28;18;10;18;18;10;8"
                    keyTimes="0;0.14;0.28;0.38;0.5;0.58;0.66;0.74;0.84;0.92;1"
                    dur="2.8s"
                    begin="0.3s"
                    fill="freeze"
                  />
                </circle>

                {/* Core bright dot */}
                <circle r="0" fill={orbFill}>
                  <animateMotion
                    dur="2.8s"
                    begin="0.3s"
                    fill="freeze"
                    calcMode="spline"
                    keyPoints="0;0.14;0.2;0.28;0.38;0.5;0.58;0.66;0.74;0.84;1"
                    keyTimes="0;0.14;0.2;0.28;0.38;0.5;0.58;0.66;0.74;0.84;1"
                    keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"
                    path="M 80 290 L 329 290 L 385 210 L 465 80 L 544 480 L 623 290 L 679 290 L 747 193 L 826 358 L 944 290"
                  />
                  <animate
                    attributeName="r"
                    values="5;5;9;14;14;9;5;9;9;5;4"
                    keyTimes="0;0.14;0.28;0.38;0.5;0.58;0.66;0.74;0.84;0.92;1"
                    dur="2.8s"
                    begin="0.3s"
                    fill="freeze"
                  />
                </circle>
              </g>
            </svg>
          </div>

          {/* ══════════════════════════════════════
              Wordmark + tagline
          ══════════════════════════════════════ */}
          <div className="ls-wordmark flex flex-col items-center gap-2">
            <span
              style={{
                fontFamily: '"SF Mono","Fira Code","JetBrains Mono",ui-monospace,monospace',
                fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: wordColor,
                lineHeight: 1,
              }}
            >
              CommitPulse
            </span>
            <span
              style={{
                fontFamily: '"SF Mono","Fira Code",ui-monospace,monospace',
                fontSize: '0.62rem',
                letterSpacing: '0.24em',
                color: tagColor,
                textTransform: 'uppercase',
              }}
            >
              your github · visualized
            </span>
          </div>

          {/* Three dot loader */}
          <div className="flex items-center gap-2.5">
            <span className={`ls-dot block w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <span className={`ls-dot block w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <span className={`ls-dot block w-1.5 h-1.5 rounded-full ${dotColor}`} />
          </div>
        </div>
      </div>
    </>
  );
}
