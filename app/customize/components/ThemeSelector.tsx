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
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer"
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
    <div className="flex flex-col gap-1.5">
      <SectionLabel>Theme Preset</SectionLabel>

      <ThemeQuickPresets theme={theme} onThemeChange={onThemeChange} />

      <div className="relative">
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

        <div className="mt-2 flex gap-1.5">
          {isAuto ? (
            <>
              {/* Split swatch: left half = light bg, right half = dark bg */}
              <span
                title="Light → Dark (auto)"
                className="w-5 h-5 rounded-md border border-white/10 overflow-hidden flex"
              >
                <span className="w-1/2 h-full" style={{ backgroundColor: `#${themes.light.bg}` }} />
                <span className="w-1/2 h-full" style={{ backgroundColor: `#${themes.dark.bg}` }} />
              </span>
              <span className="text-[11px] text-white/25 ml-1 self-center">
                switches with OS theme
              </span>
            </>
          ) : isRandom ? (
            <>
              {randomAccentColors.map((color, index) => (
                <span
                  key={color}
                  title={`Random accent sample ${index + 1}: #${color}`}
                  className="w-5 h-5 rounded-full border border-white/10"
                  style={{ backgroundColor: `#${color}` }}
                />
              ))}
              <span className="text-[11px] text-white/25 ml-1 self-center">
                changes on each load
              </span>
            </>
          ) : (
            <>
              {(['bg', 'accent', 'text'] as const).map((prop) => {
                const color = themes[theme as ThemeKey]?.[prop];
                return color ? (
                  <span
                    key={prop}
                    title={`${prop}: #${color}`}
                    className="w-5 h-5 rounded-md border border-white/10"
                    style={{ backgroundColor: `#${color}` }}
                  />
                ) : null;
              })}
              <span className="text-[11px] text-white/25 ml-1 self-center">bg · accent · text</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { StyledSelect };
