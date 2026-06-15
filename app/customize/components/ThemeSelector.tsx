import type { ReactElement, ReactNode } from 'react';
import { Shuffle } from 'lucide-react';
import { themes } from '../../../lib/svg/themes';
import { THEME_KEYS, type ThemeKey } from '../types';
import { SectionLabel } from './SectionLabel';
import { ThemeQuickPresets } from './ThemeQuickPresets';
import { useTranslation } from '@/context/TranslationContext';

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
  const { t } = useTranslation();

  const handleRandomTheme = () => {
    const selectableThemes = THEME_KEYS.filter((k) => k !== 'auto' && k !== 'random');
    const randomKey = selectableThemes[Math.floor(Math.random() * selectableThemes.length)];
    onThemeChange(randomKey);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <SectionLabel>{t('customize.controls.theme_presets')}</SectionLabel>
        <button
          onClick={handleRandomTheme}
          title="Pick a random theme"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Shuffle
        </button>
      </div>

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
              <span className="text-[11px] text-gray-500 dark:text-white/60 ml-1 self-center">
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
              <span className="text-[11px] text-gray-500 dark:text-white/60 ml-1 self-center">
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
              <span className="text-[11px] text-gray-500 dark:text-white/60 ml-1 self-center">
                bg · accent · text
              </span>{' '}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { StyledSelect };
