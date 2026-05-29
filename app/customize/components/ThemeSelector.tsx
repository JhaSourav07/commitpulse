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
  ariaLabel,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  ariaLabel?: string;
}): ReactElement {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-100/80 backdrop-blur-md border border-black/10 dark:bg-white/[0.03] dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-black dark:text-white outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark] [&>option]:bg-white [&>option]:text-black dark:[&>option]:bg-[#0a0a0a] dark:[&>option]:text-white"
    >
      {children}
    </select>
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
