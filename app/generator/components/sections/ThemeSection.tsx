'use client';

import { SectionCard, FieldLabel } from '../SectionCard';

export interface ThemeSectionProps {
  themeBg?: string;
  themeText?: string;
  themeBorder?: string;
  themeIcon?: string;
  onThemeBgChange: (v: string) => void;
  onThemeTextChange: (v: string) => void;
  onThemeBorderChange: (v: string) => void;
  onThemeIconChange: (v: string) => void;
  onReset?: () => void;
}

export function ThemeSection({
  themeBg = '',
  themeText = '',
  themeBorder = '',
  themeIcon = '',
  onThemeBgChange,
  onThemeTextChange,
  onThemeBorderChange,
  onThemeIconChange,
  onReset,
}: ThemeSectionProps) {
  const renderColorInput = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void
  ) => {
    const isValid = value === '' || /^[0-9a-fA-F]{6}$/.test(value);

    return (
      <div key={id}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs text-gray-400 dark:text-white/30 select-none">
              #
            </span>
            <input
              id={id}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value.replace(/^#/, ''))}
              placeholder="10b981"
              maxLength={6}
              spellCheck={false}
              className="w-32 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 pl-7 pr-3 py-2.5 text-sm font-mono text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors"
            />
          </div>
          <div
            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex-shrink-0 transition-colors"
            style={{
              background: isValid && value ? `#${value}` : 'transparent',
            }}
          />
          {value && !isValid && <p className="text-[11px] text-amber-500">Invalid hex</p>}
          {value && isValid && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-[11px] text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/60 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    );
  };

  const activeCount = [themeBg, themeText, themeBorder, themeIcon].filter(Boolean).length;

  return (
    <SectionCard
      title="Custom Color Palette Picker"
      description="Customize the colors of the generated SVGs"
      defaultOpen={false}
      badge={activeCount}
      onReset={onReset}
    >
      <div className="flex flex-col gap-4">
        {renderColorInput('theme-bg', 'Background Colour (bg)', themeBg, onThemeBgChange)}
        {renderColorInput('theme-text', 'Text Colour (text)', themeText, onThemeTextChange)}
        {renderColorInput(
          'theme-icon',
          'Icon/Accent Colour (accent)',
          themeIcon,
          onThemeIconChange
        )}
        {renderColorInput(
          'theme-border',
          'Border Colour (border)',
          themeBorder,
          onThemeBorderChange
        )}
      </div>
    </SectionCard>
  );
}
