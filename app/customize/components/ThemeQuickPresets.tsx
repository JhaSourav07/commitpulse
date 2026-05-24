import type { ReactElement } from 'react';
import { themes } from '../../../lib/svg/themes';
import { THEME_KEYS, type ThemeKey } from '../types';

type ThemeQuickPresetsProps = {
  theme: string;
  onThemeChange: (theme: string) => void;
};

type IC = { bg: string; text: string; accent: string };

function IconDark({ bg, text, accent }: IC): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="12" cy="14" r="7.5" fill={text} opacity="0.9" />
      <circle cx="16" cy="10.5" r="6" fill={bg} />
      <circle cx="21" cy="6" r="1.3" fill={accent} opacity="0.95" />
      <circle cx="24" cy="11" r="0.85" fill={text} opacity="0.6" />
      <circle cx="20" cy="4" r="0.95" fill={accent} opacity="0.8" />
    </svg>
  );
}

function IconLight({ text, accent }: IC): ReactElement {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="5.5" fill={accent} opacity="0.95" />
      {rays.map((deg) => {
        const r = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={14 + 7.5 * Math.cos(r)}
            y1={14 + 7.5 * Math.sin(r)}
            x2={14 + 10.5 * Math.cos(r)}
            y2={14 + 10.5 * Math.sin(r)}
            stroke={text}
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.75"
          />
        );
      })}
    </svg>
  );
}

function IconNeon({ text, accent }: IC): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M16 3 L8 15 H13.5 L11 25 L21 13 H15.5 Z" fill={accent} opacity="0.95" />
      <path
        d="M16 3 L8 15 H13.5 L11 25 L21 13 H15.5 Z"
        stroke={text}
        strokeWidth="0.6"
        fill="none"
        opacity="0.45"
      />
    </svg>
  );
}

function IconGithub({ text, accent }: IC): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M10 6 L3.5 14 L10 22"
        stroke={accent}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 6 L24.5 14 L18 22"
        stroke={text}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="14"
        y1="5"
        x2="14"
        y2="23"
        stroke={text}
        strokeWidth="1.2"
        strokeDasharray="2.5 2.5"
        opacity="0.3"
      />
    </svg>
  );
}

function IconDracula({ text, accent }: IC): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M14 13 C12 8 4 9 4 13 C4 17 8.5 17.5 11.5 15.5
           L11.5 18.5 L14 17 L16.5 18.5 L16.5 15.5
           C19.5 17.5 24 17 24 13 C24 9 16 8 14 13 Z"
        fill={accent}
        opacity="0.9"
      />
      <path d="M10.5 13 L9.5 8.5 L12.5 12 Z" fill={text} opacity="0.85" />
      <path d="M17.5 13 L18.5 8.5 L15.5 12 Z" fill={text} opacity="0.85" />
      <circle cx="12" cy="13.5" r="1.1" fill="rgba(0,0,0,0.55)" />
      <circle cx="16" cy="13.5" r="1.1" fill="rgba(0,0,0,0.55)" />
    </svg>
  );
}

function IconOcean({ text, accent }: IC): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M2 9 C5.5 5 9.5 5 13 9 C16.5 13 20.5 13 24 9"
        stroke={text}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.45"
      />
      <path
        d="M2 15 C5.5 11 9.5 11 13 15 C16.5 19 20.5 19 24 15"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      <path
        d="M2 21 C5.5 17 9.5 17 13 21 C16.5 25 20.5 25 24 21"
        stroke={text}
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />
    </svg>
  );
}

function IconSunset({ text, accent }: IC): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <line
        x1="14"
        y1="2"
        x2="14"
        y2="5.5"
        stroke={accent}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.75"
      />
      <line
        x1="5.5"
        y1="5.5"
        x2="7.5"
        y2="7.5"
        stroke={accent}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="22.5"
        y1="5.5"
        x2="20.5"
        y2="7.5"
        stroke={accent}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="2"
        y1="14"
        x2="5.5"
        y2="14"
        stroke={accent}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.5"
      />
      <line
        x1="26"
        y1="14"
        x2="22.5"
        y2="14"
        stroke={accent}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path d="M 5,18 A 9,9 0 0 1 23,18" fill={accent} opacity="0.95" />
      <line x1="2" y1="18" x2="26" y2="18" stroke={text} strokeWidth="1.6" opacity="0.85" />
      <line x1="2" y1="21" x2="26" y2="21" stroke={text} strokeWidth="1.1" opacity="0.4" />
      <line x1="2" y1="24" x2="26" y2="24" stroke={text} strokeWidth="0.8" opacity="0.2" />
    </svg>
  );
}

function IconForest({ text, accent }: IC): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <polygon points="14,3 21,12 7,12" fill={accent} opacity="0.95" />
      <polygon points="14,8 22,17 6,17" fill={accent} opacity="0.82" />
      <polygon points="14,13 23,23 5,23" fill={accent} opacity="0.68" />
      <rect x="12" y="23" width="4" height="4" rx="1" fill={text} opacity="0.6" />
    </svg>
  );
}

function IconRose({ text, accent }: IC): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <ellipse cx="14" cy="8" rx="3.5" ry="6" fill={accent} opacity="0.72" />
      <ellipse cx="14" cy="20" rx="3.5" ry="6" fill={accent} opacity="0.72" />
      <ellipse cx="8" cy="14" rx="6" ry="3.5" fill={accent} opacity="0.65" />
      <ellipse cx="20" cy="14" rx="6" ry="3.5" fill={accent} opacity="0.65" />
      <ellipse
        cx="14"
        cy="14"
        rx="3.5"
        ry="5.5"
        fill={accent}
        opacity="0.48"
        transform="rotate(45 14 14)"
      />
      <ellipse
        cx="14"
        cy="14"
        rx="3.5"
        ry="5.5"
        fill={accent}
        opacity="0.48"
        transform="rotate(-45 14 14)"
      />
      <circle cx="14" cy="14" r="4" fill={text} opacity="0.92" />
      <circle cx="14" cy="14" r="1.8" fill={accent} opacity="0.8" />
    </svg>
  );
}

function IconNord({ text, accent }: IC): ReactElement {
  const arms = [0, 60, 120, 180, 240, 300];
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {arms.map((deg) => {
        const r = (deg * Math.PI) / 180;
        const sx = Math.sin(r),
          cy = Math.cos(r);
        const x2 = 14 + 10 * sx,
          y2 = 14 - 10 * cy;
        const mx = 14 + 6 * sx,
          my = 14 - 6 * cy;
        const px = cy,
          py = sx;
        return (
          <g key={deg}>
            <line
              x1="14"
              y1="14"
              x2={x2}
              y2={y2}
              stroke={text}
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.82"
            />
            <line
              x1={mx - 2.5 * px}
              y1={my - 2.5 * py}
              x2={mx + 2.5 * px}
              y2={my + 2.5 * py}
              stroke={text}
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.6"
            />
          </g>
        );
      })}
      <circle cx="14" cy="14" r="2.8" fill={accent} opacity="0.95" />
    </svg>
  );
}

function IconSynthwave({ bg, text, accent }: IC): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M 3,14 A 11,11 0 0 1 25,14" fill={accent} opacity="0.9" />
      <rect x="2" y="8.5" width="24" height="1.8" fill={bg} opacity="0.88" />
      <rect x="2" y="11.5" width="24" height="1.4" fill={bg} opacity="0.75" />
      <line x1="2" y1="14" x2="26" y2="14" stroke={text} strokeWidth="1.3" opacity="0.6" />
      <line x1="14" y1="14" x2="2" y2="28" stroke={text} strokeWidth="0.9" opacity="0.45" />
      <line x1="14" y1="14" x2="8" y2="28" stroke={text} strokeWidth="0.9" opacity="0.45" />
      <line x1="14" y1="14" x2="20" y2="28" stroke={text} strokeWidth="0.9" opacity="0.45" />
      <line x1="14" y1="14" x2="26" y2="28" stroke={text} strokeWidth="0.9" opacity="0.45" />
      <line x1="2" y1="18.5" x2="26" y2="18.5" stroke={text} strokeWidth="0.8" opacity="0.32" />
      <line x1="2" y1="23" x2="26" y2="23" stroke={text} strokeWidth="0.7" opacity="0.2" />
    </svg>
  );
}

const ICON_MAP: Record<string, (c: IC) => ReactElement> = {
  dark: (c) => <IconDark {...c} />,
  light: (c) => <IconLight {...c} />,
  neon: (c) => <IconNeon {...c} />,
  github: (c) => <IconGithub {...c} />,
  dracula: (c) => <IconDracula {...c} />,
  ocean: (c) => <IconOcean {...c} />,
  sunset: (c) => <IconSunset {...c} />,
  forest: (c) => <IconForest {...c} />,
  rose: (c) => <IconRose {...c} />,
  nord: (c) => <IconNord {...c} />,
  synthwave: (c) => <IconSynthwave {...c} />,
};

export function ThemeQuickPresets({ theme, onThemeChange }: ThemeQuickPresetsProps): ReactElement {
  return (
    <>
      <style>{`
        @keyframes tqp-pop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.13); }
          70%  { transform: scale(0.97); }
          100% { transform: scale(1.06); }
        }
        @keyframes tqp-pulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
        .tqp-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 11px;
          border: 1.5px solid transparent;
          cursor: pointer;
          outline: none;
          transition:
            transform 150ms cubic-bezier(.34,1.56,.64,1),
            border-color 150ms ease,
            box-shadow 150ms ease;
          overflow: hidden;
        }
        .tqp-btn:hover:not(.tqp-on) {
          transform: scale(1.06);
          border-color: rgba(255,255,255,0.22);
          box-shadow: 0 3px 12px rgba(0,0,0,0.3);
        }
        .tqp-btn:focus-visible {
          box-shadow: 0 0 0 3px rgba(99,179,237,0.55);
        }
        .tqp-on {
          border-color: rgba(255,255,255,0.38);
          box-shadow: 0 0 0 1.5px rgba(255,255,255,0.1), 0 3px 12px rgba(0,0,0,0.35);
          transform: scale(1.03);
        }
        /* glass shine overlay */
        .tqp-shine {
          pointer-events: none;
          position: absolute;
          inset: 0;
          border-radius: 9px;
          background: linear-gradient(
            155deg,
            rgba(255,255,255,0.17) 0%,
            rgba(255,255,255,0.03) 42%,
            rgba(0,0,0,0.08) 100%
          );
        }
        /* subtle active border ring — no pulse */
        .tqp-ring {
          pointer-events: none;
          position: absolute;
          inset: -2px;
          border-radius: 13px;
          border: 1px solid rgba(255,255,255,0.28);
        }
        /* small active indicator dot */
        .tqp-dot {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,0.85);
        }
      `}</style>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {THEME_KEYS.filter((key) => key !== 'auto' && key !== 'random').map((key) => {
          const t = themes[key as ThemeKey];
          if (!t) return null;

          const isActive = theme === key;
          const colors: IC = {
            bg: `#${t.bg}`,
            text: `#${t.text}`,
            accent: `#${t.accent}`,
          };
          const renderIcon = ICON_MAP[key];

          return (
            <button
              key={key}
              type="button"
              title={key.charAt(0).toUpperCase() + key.slice(1)}
              aria-label={`Apply ${key} theme`}
              aria-pressed={isActive}
              onClick={() => onThemeChange(key)}
              className={`tqp-btn${isActive ? ' tqp-on' : ''}`}
              style={{
                background: `linear-gradient(145deg, rgba(255,255,255,0.1), #${t.bg} 0%)`,
              }}
            >
              <span className="tqp-shine" />
              {isActive && <span className="tqp-ring" />}
              {isActive && <span className="tqp-dot" />}
              {renderIcon ? renderIcon(colors) : null}
            </button>
          );
        })}
      </div>
    </>
  );
}
