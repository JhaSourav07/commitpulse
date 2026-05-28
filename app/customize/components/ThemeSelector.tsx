import type { ReactElement, ReactNode } from 'react';
import { themes } from '../../../lib/svg/themes';
import { THEME_KEYS, type ThemeKey } from '../types';
import { SectionLabel } from './SectionLabel';
import { ThemeQuickPresets } from './ThemeQuickPresets';

function StyledSelect({
  id,
  value,
  onChange,
  children,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cp-select"
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path
            d="M1.5 3.5L5 7L8.5 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

export function ThemeSelector({
  theme,
  onThemeChange,
}: {
  theme: string;
  onThemeChange: (theme: string) => void;
}): ReactElement {
  const isAuto = theme === 'auto';
  const isRandom = theme === 'random';
  const randomAccentColors = [themes.neon.accent, themes.ocean.accent, themes.sunset.accent];

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Theme Preset</SectionLabel>

      <ThemeQuickPresets theme={theme} onThemeChange={onThemeChange} />

      <StyledSelect id="theme-select" value={theme} onChange={onThemeChange}>
        {THEME_KEYS.map((key) => (
          <option key={key} value={key}>
            {key === 'auto'
              ? 'Auto (System)'
              : key === 'random'
                ? 'Random'
                : key.charAt(0).toUpperCase() + key.slice(1)}
          </option>
        ))}
      </StyledSelect>

      {/* Swatch row */}
      <div className="flex items-center gap-2 px-0.5">
        {isAuto ? (
          <>
            <span
              title="Light → Dark (auto)"
              className="w-4 h-4 rounded flex-shrink-0 overflow-hidden flex"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <span className="w-1/2 h-full" style={{ backgroundColor: `#${themes.light.bg}` }} />
              <span className="w-1/2 h-full" style={{ backgroundColor: `#${themes.dark.bg}` }} />
            </span>
            <span className="text-[10px] text-white/30">switches with OS theme</span>
          </>
        ) : isRandom ? (
          <>
            {randomAccentColors.map((color, i) => (
              <span
                key={color}
                title={`Sample ${i + 1}: #${color}`}
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: `#${color}`, border: '1px solid rgba(255,255,255,0.12)' }}
              />
            ))}
            <span className="text-[10px] text-white/30">changes on each load</span>
          </>
        ) : (
          <>
            {(['bg', 'accent', 'text'] as const).map((prop) => {
              const color = themes[theme as ThemeKey]?.[prop];
              return color ? (
                <span
                  key={prop}
                  title={`${prop}: #${color}`}
                  className="w-4 h-4 rounded flex-shrink-0"
                  style={{
                    backgroundColor: `#${color}`,
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                />
              ) : null;
            })}
            <span className="text-[10px] text-white/30">bg · accent · text</span>
          </>
        )}
      </div>
    </div>
  );
}

export { StyledSelect };
