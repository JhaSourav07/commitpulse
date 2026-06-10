// app/customize/components/ThemeQuickPresets.tsx
import type { ReactElement } from 'react';
import { themes } from '../../../lib/svg/themes';
import { THEME_KEYS, type ThemeKey } from '../types';
import './ThemeQuickPresets.css';
type ThemeQuickPresetsProps = {
  theme: string;
  onThemeChange: (theme: string) => void;
};

type IC = { bg: string; text: string; accent: string };

// Helper to round floating-point math to avoid Server/Client hydration mismatches
const r3 = (n: number) => Number(n.toFixed(3));

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
            x1={r3(14 + 7.5 * Math.cos(r))}
            y1={r3(14 + 7.5 * Math.sin(r))}
            x2={r3(14 + 10.5 * Math.cos(r))}
            y2={r3(14 + 10.5 * Math.sin(r))}
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
              x2={r3(x2)}
              y2={r3(y2)}
              stroke={text}
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.82"
            />
            <line
              x1={r3(mx - 2.5 * px)}
              y1={r3(my - 2.5 * py)}
              x2={r3(mx + 2.5 * px)}
              y2={r3(my + 2.5 * py)}
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

function IconGruvbox({ bg, text, accent }: IC): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* top handle */}
      <path
        d="M11 9C11 6.8 12.3 5.5 14 5.5C15.7 5.5 17 6.8 17 9"
        stroke={text}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* handle connectors */}
      <path
        d="M11.5 9.5L10 12.5M16.5 9.5L18 12.5"
        stroke={text}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.75"
      />
      {/* lantern body */}
      <rect x="8" y="11" width="12" height="11" rx="2.5" fill={text} opacity="0.82" />
      {/* glass chamber */}
      <rect x="10.2" y="13" width="7.6" height="6.8" rx="1.5" fill={bg} opacity="0.9" />
      {/* warm glow */}
      <ellipse cx="14" cy="16.5" rx="2.8" ry="3.2" fill={accent} opacity="0.95" />
      {/* flame */}
      <path d="M14 13.8C12.8 15.5 13.1 16.8 14 18.3C14.9 16.8 15.2 15.5 14 13.8Z" fill={accent} />
      {/* bottom base */}
      <rect x="9.5" y="22" width="9" height="1.8" rx="0.9" fill={text} opacity="0.7" />
    </svg>
  );
}

function IconHighcontrast({ text, accent }: IC): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* outer eye shape */}
      <path d="M2 14 C6 6 22 6 26 14 C22 22 6 22 2 14 Z" fill={accent} opacity="0.88" />
      {/* iris */}
      <circle cx="14" cy="14" r="5" fill={text} opacity="0.9" />
      {/* pupil */}
      <circle cx="14" cy="14" r="2.2" fill="#000" opacity="0.95" />
      {/* catchlight */}
      <circle cx="15.8" cy="12.5" r="1.2" fill="#fff" opacity="0.85" />
    </svg>
  );
}

function IconCatppuccinLatte({ text, accent }: IC): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Cup body */}
      <path d="M6 10 C6 17, 7 20, 14 20 C21 20, 22 17, 22 10 Z" fill={accent} opacity="0.9" />
      {/* Cup handle */}
      <path
        d="M22 12 C24.5 12, 24.5 16, 22 16"
        stroke={accent}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Latte art / foam */}
      <ellipse cx="14" cy="10" rx="6.5" ry="1.8" fill={text} opacity="0.9" />
      {/* Steam lines */}
      <path
        d="M11 7 C11 5, 13 5, 13 3"
        stroke={text}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M15 7 C15 5, 17 5, 17 3"
        stroke={text}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}

function IconSolarizedLight({ text, accent }: IC): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="5" stroke={accent} strokeWidth="2" opacity="0.95" />
      <circle cx="14" cy="14" r="2" fill={text} opacity="0.9" />
      {/* Solar/Astronomical clean geometric rays */}
      <line x1="14" y1="3" x2="14" y2="6" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
      <line
        x1="14"
        y1="22"
        x2="14"
        y2="25"
        stroke={accent}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line x1="3" y1="14" x2="6" y2="14" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
      <line
        x1="22"
        y1="14"
        x2="25"
        y2="14"
        stroke={accent}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="6.2"
        y1="6.2"
        x2="8.3"
        y2="8.3"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="19.7"
        y1="19.7"
        x2="21.8"
        y2="21.8"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="19.7"
        y1="6.2"
        x2="17.6"
        y2="8.3"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="6.2"
        y1="19.7"
        x2="8.3"
        y2="17.6"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function IconAuroraCyberpunk({ text, accent }: IC): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Cyberpunk double triangles */}
      <polygon
        points="14,4 24,20 4,20"
        stroke={accent}
        strokeWidth="2.2"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <polygon
        points="14,10 20,20 8,20"
        stroke={text}
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <line
        x1="14"
        y1="4"
        x2="14"
        y2="20"
        stroke={accent}
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.5"
      />
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
  gruvbox: (c) => <IconGruvbox {...c} />,
  highcontrast: (c) => <IconHighcontrast {...c} />,
  aurora_cyberpunk: (c) => <IconAuroraCyberpunk {...c} />,
  catppuccin_latte: (c) => <IconCatppuccinLatte {...c} />,
  solarized_light: (c) => <IconSolarizedLight {...c} />,
  gruvbox_light: (c) => <IconGruvbox {...c} />,
  nord_light: (c) => <IconNord {...c} />,
};

export function ThemeQuickPresets({ theme, onThemeChange }: ThemeQuickPresetsProps): ReactElement {
  return (
    <>
      <div className="theme-quick-presets">
        {THEME_KEYS.filter((key) => key !== 'auto' && key !== 'random').map((key) => {
          const t = themes[key as ThemeKey];
          if (!t) return null;

          const isActive = theme === key;
          const colors: IC = {
            bg: `#${t.bg}`,
            text: `#${t.text}`,
            accent: `#${t.accent}`,
          };
          const renderIcon = ICON_MAP[key as ThemeKey];

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
