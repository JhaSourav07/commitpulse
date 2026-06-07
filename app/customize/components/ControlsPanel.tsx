import type { ReactElement, ReactNode } from 'react';
import { FONTS, SIZES, SPEEDS, type BadgeSize, type Font, type Scale } from '../types';
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
            className="w-full min-w-0 bg-gray-100/80 backdrop-blur-md border border-black/10 dark:bg-white/[0.03] dark:border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-sm font-mono text-black dark:text-emerald-300 placeholder:text-gray-400 dark:placeholder:text-white/60 outline-none focus:border-emerald-500/50 transition-colors"
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
            placeholder="your-github-username"
            className="w-full min-w-0 bg-white/60 backdrop-blur-md border border-black/10 dark:bg-black/40 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-black dark:text-emerald-300 placeholder:text-gray-400 dark:placeholder:text-white/60 outline-none focus:border-emerald-500/50 transition-all duration-300"
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
                className={`py-2.5 rounded-xl text-sm font-bold transition-all min-w-0 break-words px-1 ${
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
            <StyledSelect
              id="font-select"
              value={FONTS.some((f) => f.value === font) ? font : 'custom'}
              onChange={(v) => {
                if (v === 'custom') {
                  onFontChange('' as Font);
                } else {
                  onFontChange(v as Font);
                }
              }}
            >
              {FONTS.map((fontOption) => (
                <option key={fontOption.value} value={fontOption.value}>
                  {fontOption.label}
                </option>
              ))}
              <option value="custom">Custom Google Font...</option>
            </StyledSelect>
          </div>
          {!FONTS.some((f) => f.value === font) && (
            <input
              id="font-custom-input"
              type="text"
              value={font}
              onChange={(e) => onFontChange(e.target.value as Font)}
              placeholder="e.g. Orbitron, Space Mono, Inter"
              className="w-full min-w-0 bg-gray-100/80 backdrop-blur-md border border-black/10 dark:bg-white/[0.03] dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-black dark:text-emerald-300 placeholder:text-gray-400 dark:placeholder:text-white/60 outline-none focus:border-emerald-500/50 transition-colors mt-2"
            />
          )}
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
      </div>
    </div>
  );
}
