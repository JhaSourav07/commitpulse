import type { ReactElement, ReactNode } from 'react';
import {
  FONTS,
  SIZES,
  SPEEDS,
  LANGUAGES,
  TIMEZONES,
  VIEW_MODES,
  DELTA_FORMATS,
  type BadgeSize,
  type Font,
  type Scale,
  type ViewMode,
  type DeltaFormat,
  type Language,
  type Timezone,
} from '../types';
import { isValidHex, stripHash } from '../utils';
import { SectionLabel } from './SectionLabel';
import { StyledSelect, ThemeSelector } from './ThemeSelector';

function ControlRow({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

function HexInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}): ReactElement {
  const pickerValue = isValidHex(value) ? `#${stripHash(value)}` : '#000000';
  const swatchColor = isValidHex(value) ? pickerValue : null;

  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>{label}</SectionLabel>
      <div className="relative flex items-center gap-2">
        <label
          htmlFor={`${id}-picker`}
          title="Open color picker"
          className="relative shrink-0 w-9 h-9 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-colors"
          style={{ backgroundColor: swatchColor ?? '#1a1a1a' }}
        >
          {!swatchColor && (
            <span
              className="absolute inset-0"
              style={{
                backgroundImage: 'repeating-conic-gradient(#333 0% 25%, #1a1a1a 0% 50%)',
                backgroundSize: '8px 8px',
              }}
            />
          )}
          <input
            id={`${id}-picker`}
            type="color"
            value={pickerValue}
            onChange={(e) => onChange(stripHash(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={`Color picker for ${label}`}
          />
        </label>

        <div className="relative flex-1 flex items-center">
          <span className="absolute left-3 text-gray-400 dark:text-white/55 text-sm select-none pointer-events-none">
            #
          </span>
          <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/^#/, ''))}
            placeholder={placeholder.replace(/^#/, '')}
            maxLength={6}
            className="w-full bg-gray-100/80 backdrop-blur-md border border-black/10 dark:bg-white/[0.03] dark:border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-sm font-mono text-black dark:text-emerald-300 placeholder:text-gray-400 dark:placeholder:text-white/60 outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

export function ControlsPanel({
  username,
  theme,
  bgHex,
  accentHex,
  textHex,
  scale,
  speed,
  font,
  year,
  radius,
  size,
  onUsernameChange,
  onThemeChange,
  onBgHexChange,
  onAccentHexChange,
  onTextHexChange,
  onScaleChange,
  onSpeedChange,
  onFontChange,
  onYearChange,
  onSizeChange,
  onClearOverrides,
  onRadiusChange,
  hideTitle,
  hideBackground,
  hideStats,
  viewMode,
  deltaFormat,
  badgeWidth,
  badgeHeight,
  grace,
  language,
  timezone,
  onHideTitleChange,
  onHideBackgroundChange,
  onHideStatsChange,
  onViewModeChange,
  onDeltaFormatChange,
  onBadgeWidthChange,
  onBadgeHeightChange,
  onGraceChange,
  onLanguageChange,
  onTimezoneChange,
}: {
  username: string;
  theme: string;
  bgHex: string;
  accentHex: string;
  textHex: string;
  scale: Scale;
  speed: string;
  font: Font;
  year: string;
  radius: number;
  size: BadgeSize;
  onUsernameChange: (value: string) => void;
  onThemeChange: (value: string) => void;
  onBgHexChange: (value: string) => void;
  onAccentHexChange: (value: string) => void;
  onTextHexChange: (value: string) => void;
  onScaleChange: (value: Scale) => void;
  onSpeedChange: (value: string) => void;
  onFontChange: (value: Font) => void;
  onYearChange: (value: string) => void;
  onSizeChange: (value: BadgeSize) => void;
  onClearOverrides: () => void;
  onRadiusChange: (value: number) => void;
  hideTitle: boolean;
  hideBackground: boolean;
  hideStats: boolean;
  viewMode: ViewMode;
  deltaFormat: DeltaFormat;
  badgeWidth: number | '';
  badgeHeight: number | '';
  grace: number;
  language: Language;
  timezone: Timezone;
  onHideTitleChange: (value: boolean) => void;
  onHideBackgroundChange: (value: boolean) => void;
  onHideStatsChange: (value: boolean) => void;
  onViewModeChange: (value: ViewMode) => void;
  onDeltaFormatChange: (value: DeltaFormat) => void;
  onBadgeWidthChange: (value: number | '') => void;
  onBadgeHeightChange: (value: number | '') => void;
  onGraceChange: (value: number) => void;
  onLanguageChange: (value: Language) => void;
  onTimezoneChange: (value: Timezone) => void;
}): ReactElement {
  const hasOverrides = Boolean(bgHex || accentHex || textHex);
  const currentYear = new Date().getFullYear();
  const isAutoTheme = theme === 'auto';
  const isRandomTheme = theme === 'random';
  const disablesCustomColors = isAutoTheme || isRandomTheme;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400 mb-4">
        Controls
      </p>

      <div className="flex flex-col gap-5">
        <ControlRow label="GitHub Username">
          <input
            id="username-input"
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="jhasourav07"
            className="w-full bg-white/60 backdrop-blur-md border border-black/10 dark:bg-black/40 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-black dark:text-emerald-300 placeholder:text-gray-400 dark:placeholder:text-white/60 outline-none focus:border-emerald-500/50 transition-colors"
          />
        </ControlRow>

        <ThemeSelector theme={theme} onThemeChange={onThemeChange} />

        <div className="h-px bg-black/5 dark:bg-white/5" />
        <ControlRow label="Year">
          <div className="relative">
            <StyledSelect id="year-select" value={year} onChange={(value) => onYearChange(value)}>
              <option value="">{currentYear} (current)</option>

              {Array.from({ length: currentYear - 2019 }, (_, i) => {
                const yearOption = currentYear - i - 1;

                return (
                  <option key={yearOption} value={yearOption.toString()}>
                    {yearOption}
                  </option>
                );
              })}
            </StyledSelect>
          </div>
        </ControlRow>

        <div className="h-px bg-black/5 dark:bg-white/5" />

        <div className="h-px bg-black/5 dark:bg-white/5" />

        <div>
          <SectionLabel>Custom Color Overrides</SectionLabel>
          {disablesCustomColors ? (
            <div className="mt-2 flex flex-col gap-2">
              <p className="text-[11px] text-gray-500 dark:text-white/60 leading-relaxed">
                Custom colors are disabled for the{' '}
                <strong className="text-gray-700 dark:text-white/50">
                  {isAutoTheme ? 'Auto' : 'Random'}
                </strong>{' '}
                theme.{' '}
                {isAutoTheme
                  ? "The badge switches between light and dark palettes automatically based on the viewer's system preference."
                  : 'The badge chooses a different preset palette for each request.'}
              </p>
              {isRandomTheme && (
                <p className="rounded-lg border border-amber-400/15 bg-amber-400/5 px-3 py-2 text-[11px] leading-relaxed text-amber-200/70">
                  Random changes on every page load and disables caching for the badge URL.
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="text-[11px] text-gray-500 dark:text-white/60 mb-3 leading-relaxed">
                These override the theme preset above. Enter HEX values without&nbsp;
                <code className="text-gray-700 dark:text-white/65">#</code>.
              </p>
              <div className="flex flex-col gap-3">
                <HexInput
                  id="bg-hex-input"
                  label="Background"
                  value={bgHex}
                  onChange={onBgHexChange}
                  placeholder="e.g. 0a0a0a"
                />
                <HexInput
                  id="accent-hex-input"
                  label="Accent / Tower Color"
                  value={accentHex}
                  onChange={onAccentHexChange}
                  placeholder="e.g. 00ffaa"
                />
                <HexInput
                  id="text-hex-input"
                  label="Text / Label Color"
                  value={textHex}
                  onChange={onTextHexChange}
                  placeholder="e.g. ffffff"
                />
              </div>
              {hasOverrides && (
                <button
                  id="clear-overrides-btn"
                  onClick={onClearOverrides}
                  className="mt-3 text-[11px] text-red-400/60 hover:text-red-400 transition-colors"
                >
                  Clear overrides
                </button>
              )}
            </>
          )}
        </div>

        <div className="h-px bg-black/5 dark:bg-white/5" />

        <ControlRow label="Tower Height Scaling">
          <div className="grid grid-cols-2 gap-2">
            {(['linear', 'log'] as Scale[]).map((currentScale) => (
              <button
                key={currentScale}
                id={`scale-${currentScale}-btn`}
                onClick={() => onScaleChange(currentScale)}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                  scale === currentScale
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-gray-100/80 backdrop-blur-md border border-black/10 text-gray-700 dark:bg-white/[0.03] dark:border-white/8 dark:text-white/60 hover:bg-gray-200/70 hover:text-black hover:border-black/20 dark:hover:text-white/70 dark:hover:border-white/20'
                }`}
              >
                {currentScale === 'linear' ? 'Linear' : 'Logarithmic'}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-600 dark:text-white/60 mt-1.5 leading-relaxed">
            {scale === 'log'
              ? 'Log mode compresses extreme outliers. Great for power committers.'
              : 'Linear mode shows raw commit counts as tower heights.'}
          </p>
        </ControlRow>

        <ControlRow label="Radar Scan Speed">
          <div className="relative">
            <StyledSelect id="speed-select" value={speed} onChange={onSpeedChange}>
              {SPEEDS.map((speedOption) => (
                <option key={speedOption.value} value={speedOption.value}>
                  {speedOption.label}
                </option>
              ))}
            </StyledSelect>
          </div>
        </ControlRow>

        <ControlRow label="Font">
          <div className="relative">
            <StyledSelect id="font-select" value={font} onChange={(v) => onFontChange(v as Font)}>
              {FONTS.map((fontOption) => (
                <option key={fontOption.value} value={fontOption.value}>
                  {fontOption.label}
                </option>
              ))}
            </StyledSelect>
          </div>
        </ControlRow>

        <ControlRow label="Border Radius">
          <div className="relative flex items-center">
            <div className="absolute inset-x-0 h-1 rounded-full bg-gray-300 dark:bg-white/6" />
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={radius}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="w-full relative bg-transparent appearance-none outline-none slider"
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500 dark:text-white/55 ">
            <span>0</span>
            <span className="text-emerald-600 dark:text-emerald-300/60 font-mono text-[11px]">
              {radius}
            </span>
            <span>50</span>
          </div>
        </ControlRow>

        <ControlRow label="Badge Size">
          <div className="relative">
            <StyledSelect
              id="size-select"
              value={size}
              onChange={(v) => onSizeChange(v as BadgeSize)}
            >
              {SIZES.map((sizeOption) => (
                <option key={sizeOption.value} value={sizeOption.value}>
                  {sizeOption.label}
                </option>
              ))}
            </StyledSelect>
          </div>
        </ControlRow>

        <div className="h-px bg-black/5 dark:bg-white/5" />

        <details className="group rounded-xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20 overflow-hidden">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-gray-700 dark:text-emerald-300 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            Advanced Settings
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-gray-500 dark:text-white/65 transition-transform group-open:rotate-180"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <div className="px-4 py-4 flex flex-col gap-5 border-t border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-black/10">
            {/* Visibility Toggles */}
            <ControlRow label="Visibility Options">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-white/70">
                  <input
                    type="checkbox"
                    checked={hideTitle}
                    onChange={(e) => onHideTitleChange(e.target.checked)}
                    className="rounded border-black/20 dark:border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500/50"
                  />
                  Hide Title
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-white/70">
                  <input
                    type="checkbox"
                    checked={hideBackground}
                    onChange={(e) => onHideBackgroundChange(e.target.checked)}
                    className="rounded border-black/20 dark:border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500/50"
                  />
                  Hide Background
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-white/70">
                  <input
                    type="checkbox"
                    checked={hideStats}
                    onChange={(e) => onHideStatsChange(e.target.checked)}
                    className="rounded border-black/20 dark:border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500/50"
                  />
                  Hide Stats
                </label>
              </div>
            </ControlRow>

            <div className="h-px bg-black/5 dark:bg-white/5" />

            {/* Layout Options */}
            <ControlRow label="View Layout">
              <div className="relative">
                <StyledSelect
                  id="view-select"
                  value={viewMode}
                  onChange={(v) => onViewModeChange(v as ViewMode)}
                >
                  {VIEW_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </StyledSelect>
              </div>
            </ControlRow>

            <ControlRow label="Delta Format">
              <div className="relative">
                <StyledSelect
                  id="delta-select"
                  value={deltaFormat}
                  onChange={(v) => onDeltaFormatChange(v as DeltaFormat)}
                >
                  {DELTA_FORMATS.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </StyledSelect>
              </div>
            </ControlRow>

            <div className="h-px bg-black/5 dark:bg-white/5" />

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <ControlRow label="Width">
                <input
                  type="number"
                  min="100"
                  max="1200"
                  placeholder="Auto"
                  value={badgeWidth}
                  onChange={(e) => {
                    const val = e.currentTarget.valueAsNumber;
                    onBadgeWidthChange(Number.isNaN(val) ? '' : val);
                  }}
                  className="w-full bg-white/60 backdrop-blur-md border border-black/10 dark:bg-black/40 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-black dark:text-emerald-300 placeholder:text-gray-400 dark:placeholder:text-white/60 outline-none focus:border-emerald-500/50 transition-colors"
                />
              </ControlRow>
              <ControlRow label="Height">
                <input
                  type="number"
                  min="80"
                  max="800"
                  placeholder="Auto"
                  value={badgeHeight}
                  onChange={(e) => {
                    const val = e.currentTarget.valueAsNumber;
                    onBadgeHeightChange(Number.isNaN(val) ? '' : val);
                  }}
                  className="w-full bg-white/60 backdrop-blur-md border border-black/10 dark:bg-black/40 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-black dark:text-emerald-300 placeholder:text-gray-400 dark:placeholder:text-white/60 outline-none focus:border-emerald-500/50 transition-colors"
                />
              </ControlRow>
            </div>

            <div className="h-px bg-black/5 dark:bg-white/5" />

            {/* Grace and Localization */}
            <ControlRow label="Grace Days">
              <div className="relative flex items-center">
                <div className="absolute inset-x-0 h-1 rounded-full bg-gray-300 dark:bg-white/6" />
                <input
                  type="range"
                  min="0"
                  max="7"
                  step="1"
                  value={grace}
                  onChange={(e) => onGraceChange(Number(e.target.value))}
                  className="w-full relative bg-transparent appearance-none outline-none slider"
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-white/55">
                <span>0</span>
                <span className="text-emerald-600 dark:text-emerald-300/60 font-mono text-[11px]">
                  {grace}
                </span>
                <span>7</span>
              </div>
            </ControlRow>

            <ControlRow label="Language">
              <div className="relative">
                <StyledSelect
                  id="lang-select"
                  value={language}
                  onChange={(v) => onLanguageChange(v as Language)}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </StyledSelect>
              </div>
            </ControlRow>

            <ControlRow label="Timezone">
              <div className="relative">
                <StyledSelect
                  id="timezone-select"
                  ariaLabel="Timezone"
                  value={timezone}
                  onChange={(v) => onTimezoneChange(v as Timezone)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </StyledSelect>
              </div>
            </ControlRow>
          </div>
        </details>
      </div>
    </div>
  );
}
