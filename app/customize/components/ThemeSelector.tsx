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

  // ✅ ADD THIS FUNCTION
  const handleRandomTheme = () => {
    const filteredThemes = THEME_KEYS.filter((key) => key !== 'auto' && key !== 'random');

    let randomTheme = theme;

    // ensure new theme is different
    while (randomTheme === theme) {
      const randomIndex = Math.floor(Math.random() * filteredThemes.length);
      randomTheme = filteredThemes[randomIndex];
    }

    onThemeChange(randomTheme);
  };

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

        {/* ✅ ADD BUTTON HERE */}
        <button
          onClick={handleRandomTheme}
          className="mt-2 px-3 py-1.5 text-xs rounded-lg bg-black/80 text-white hover:bg-black dark:bg-white/10 dark:hover:bg-white/20 transition"
          title="Shuffle theme"
        >
          🎲 Random Theme
        </button>

        <div className="mt-2 flex gap-1.5">
          {isAuto ? (
            <>
              <span
                title="Light → Dark (auto)"
                className="w-5 h-5 rounded-md border border-white/10 overflow-hidden flex"
              >
                <span className="w-1/2 h-full" style={{ backgroundColor: `#${themes.light.bg}` }} />
                <span className="w-1/2 h-full" style={{ backgroundColor: `#${themes.dark.bg}` }} />
              </span>
              <span className="text-[11px] text-gray-500 dark:text-white/25 ml-1 self-center">
                switches with OS theme
              </span>
            </>
          ) : isRandom ? (
            <>
              {randomAccentColors.map((color, index) => (
                <span
                  key={color}
                  title={`Random accent sample ${index + 1}: #${color}`}
                  className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10"
                  style={{ backgroundColor: `#${color}` }}
                />
              ))}
              <span className="text-[11px] text-gray-500 dark:text-white/25 ml-1 self-center">
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
                    className="w-5 h-5 rounded-md border border-black/10 dark:border-white/10"
                    style={{ backgroundColor: `#${color}` }}
                  />
                ) : null;
              })}
              <span className="text-[11px] text-gray-500 dark:text-white/25 ml-1 self-center">
                bg · accent · text
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { StyledSelect };
