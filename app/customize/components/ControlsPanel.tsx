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

// ─── Primitives ───────────────────────────────────────────────────────────────

function ControlRow({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}): ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>{label}</SectionLabel>
      {children}
      {hint && <p className="text-[11px] text-white/25 leading-relaxed mt-0.5">{hint}</p>}
    </div>
  );
}

function SectionDivider(): ReactElement {
  return (
    <div className="relative flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
    </div>
  );
}

/** Visually grouped card block inside the panel */
function FieldGroup({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      className="relative rounded-2xl p-4 flex flex-col gap-4"
      style={{
        background:
          'linear-gradient(145deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.012) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 3px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}): ReactElement {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`cp-toggle${checked ? ' on' : ''}`}
    />
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
      <div className="flex items-center gap-2.5">
        <label
          htmlFor={`${id}-picker`}
          title="Open color picker"
          className="relative shrink-0 w-10 h-10 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          style={{
            backgroundColor: swatchColor ?? '#1a1f2e',
            border: swatchColor ? `2px solid ${swatchColor}40` : '1px solid rgba(255,255,255,0.1)',
            boxShadow: swatchColor
              ? `0 0 0 1px rgba(255,255,255,0.06), 0 4px 12px ${swatchColor}30`
              : '0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {!swatchColor && (
            <span
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'repeating-conic-gradient(rgba(255,255,255,0.05) 0% 25%, transparent 0% 50%)',
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
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 text-sm font-mono select-none pointer-events-none">
            #
          </span>
          <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/^#/, ''))}
            placeholder={placeholder.replace(/^#/, '')}
            maxLength={6}
            className="cp-input pl-8 font-mono !text-emerald-300/80"
          />
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  onChange,
  displayValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  displayValue: string;
}): ReactElement {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <ControlRow label={label}>
      <div className="flex flex-col gap-2">
        <div className="relative flex items-center h-5">
          {/* Track */}
          <div
            className="absolute inset-x-0 h-[3px] rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #059669, #10b981, #34d399)',
              }}
            />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step="1"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full relative bg-transparent appearance-none outline-none slider"
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-white/20 tabular-nums">{min}</span>
          <span
            className="text-[11px] font-mono font-semibold tabular-nums px-2 py-0.5 rounded-md"
            style={{
              background: 'rgba(16,185,129,0.1)',
              color: 'rgba(52,211,153,0.9)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            {displayValue}
          </span>
          <span className="text-[10px] text-white/20 tabular-nums">{max}</span>
        </div>
      </div>
    </ControlRow>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
  onUsernameChange: (v: string) => void;
  onThemeChange: (v: string) => void;
  onBgHexChange: (v: string) => void;
  onAccentHexChange: (v: string) => void;
  onTextHexChange: (v: string) => void;
  onScaleChange: (v: Scale) => void;
  onSpeedChange: (v: string) => void;
  onFontChange: (v: Font) => void;
  onYearChange: (v: string) => void;
  onSizeChange: (v: BadgeSize) => void;
  onClearOverrides: () => void;
  onRadiusChange: (v: number) => void;
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
  onHideTitleChange: (v: boolean) => void;
  onHideBackgroundChange: (v: boolean) => void;
  onHideStatsChange: (v: boolean) => void;
  onViewModeChange: (v: ViewMode) => void;
  onDeltaFormatChange: (v: DeltaFormat) => void;
  onBadgeWidthChange: (v: number | '') => void;
  onBadgeHeightChange: (v: number | '') => void;
  onGraceChange: (v: number) => void;
  onLanguageChange: (v: Language) => void;
  onTimezoneChange: (v: Timezone) => void;
}): ReactElement {
  const hasOverrides = Boolean(bgHex || accentHex || textHex);
  const currentYear = new Date().getFullYear();
  const isAutoTheme = theme === 'auto';
  const isRandomTheme = theme === 'random';
  const disablesCustomColors = isAutoTheme || isRandomTheme;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Identity ─────────────────────────────────────────────────────── */}
      <FieldGroup>
        <ControlRow label="GitHub Username">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="your-github-username"
              className="cp-input !pl-9 font-mono !text-emerald-300/85"
            />
          </div>
        </ControlRow>

        <ControlRow label="Year">
          <StyledSelect id="year-select" value={year} onChange={onYearChange}>
            <option value="">{currentYear} (current)</option>
            {Array.from({ length: currentYear - 2019 }, (_, i) => {
              const y = currentYear - i - 1;
              return (
                <option key={y} value={y.toString()}>
                  {y}
                </option>
              );
            })}
          </StyledSelect>
        </ControlRow>
      </FieldGroup>

      {/* ── Theme ────────────────────────────────────────────────────────── */}
      <FieldGroup>
        <ThemeSelector theme={theme} onThemeChange={onThemeChange} />
      </FieldGroup>

      {/* ── Colors ───────────────────────────────────────────────────────── */}
      <FieldGroup>
        <div>
          <SectionLabel>Custom Color Overrides</SectionLabel>
          {disablesCustomColors ? (
            <div
              className="rounded-xl px-4 py-3 mt-1"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p className="text-[11px] text-white/35 leading-relaxed">
                Custom colors are disabled for the{' '}
                <span className="text-white/60 font-semibold">
                  {isAutoTheme ? 'Auto' : 'Random'}
                </span>{' '}
                theme.{' '}
                {isAutoTheme
                  ? "The badge switches palettes based on the viewer's system preference."
                  : 'A different preset palette is chosen for each request.'}
              </p>
              {isRandomTheme && (
                <p
                  className="mt-2 rounded-lg px-3 py-2 text-[11px] leading-relaxed text-amber-300/60"
                  style={{
                    background: 'rgba(251,191,36,0.05)',
                    border: '1px solid rgba(251,191,36,0.12)',
                  }}
                >
                  Random mode disables caching for the badge URL.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              <p className="text-[11px] text-white/25 leading-relaxed">
                Override the theme preset with custom HEX values (without{' '}
                <code className="text-white/40 font-mono">#</code>).
              </p>
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
              {hasOverrides && (
                <button
                  id="clear-overrides-btn"
                  onClick={onClearOverrides}
                  className="self-start text-[11px] text-red-400/50 hover:text-red-400/90 transition-colors duration-200 flex items-center gap-1"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                  Clear overrides
                </button>
              )}
            </div>
          )}
        </div>
      </FieldGroup>

      {/* ── Appearance ───────────────────────────────────────────────────── */}
      <FieldGroup>
        <ControlRow label="Tower Height Scaling">
          <div className="grid grid-cols-2 gap-2">
            {(['linear', 'log'] as Scale[]).map((s) => (
              <button
                key={s}
                id={`scale-${s}-btn`}
                onClick={() => onScaleChange(s)}
                className="py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
                style={
                  scale === s
                    ? {
                        background:
                          'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.08) 100%)',
                        border: '1px solid rgba(16,185,129,0.35)',
                        color: '#34d399',
                        boxShadow:
                          '0 0 20px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
                      }
                    : {
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.35)',
                      }
                }
                onMouseEnter={(e) => {
                  if (scale !== s) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (scale !== s) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(255,255,255,0.03)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)';
                  }
                }}
              >
                {s === 'linear' ? 'Linear' : 'Logarithmic'}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-white/25 leading-relaxed">
            {scale === 'log'
              ? 'Compresses extreme outliers — great for power committers.'
              : 'Shows raw commit counts as tower heights.'}
          </p>
        </ControlRow>

        <ControlRow label="Radar Scan Speed">
          <StyledSelect id="speed-select" value={speed} onChange={onSpeedChange}>
            {SPEEDS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </StyledSelect>
        </ControlRow>

        <ControlRow label="Font">
          <StyledSelect id="font-select" value={font} onChange={(v) => onFontChange(v as Font)}>
            {FONTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </StyledSelect>
        </ControlRow>

        <ControlRow label="Badge Size">
          <StyledSelect
            id="size-select"
            value={size}
            onChange={(v) => onSizeChange(v as BadgeSize)}
          >
            {SIZES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </StyledSelect>
        </ControlRow>

        <SliderRow
          label="Border Radius"
          value={radius}
          min={0}
          max={50}
          onChange={onRadiusChange}
          displayValue={`${radius}px`}
        />
      </FieldGroup>

      {/* ── Advanced ─────────────────────────────────────────────────────── */}
      <details className="group">
        <summary className="list-none cursor-pointer select-none">
          <div
            className="flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group-open:rounded-b-none"
            style={{
              background:
                'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <span className="flex items-center gap-2.5 text-xs font-semibold text-white/45">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/25"
                aria-hidden="true"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Advanced Settings
            </span>
            <svg
              className="w-3.5 h-3.5 text-white/25 transition-transform duration-200 group-open:rotate-180"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </summary>

        <div
          className="flex flex-col gap-4 px-4 py-4 rounded-b-2xl"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.018) 0%, rgba(255,255,255,0.008) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderTop: 'none',
          }}
        >
          {/* Visibility toggles */}
          <div>
            <SectionLabel>Visibility Options</SectionLabel>
            <div
              className="flex flex-col gap-0 rounded-xl overflow-hidden mt-1"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {[
                {
                  id: 'toggle-hide-title',
                  label: 'Hide Title',
                  checked: hideTitle,
                  onChange: onHideTitleChange,
                },
                {
                  id: 'toggle-hide-bg',
                  label: 'Hide Background',
                  checked: hideBackground,
                  onChange: onHideBackgroundChange,
                },
                {
                  id: 'toggle-hide-stats',
                  label: 'Hide Stats',
                  checked: hideStats,
                  onChange: onHideStatsChange,
                },
              ].map(({ id, label, checked, onChange }, i, arr) => (
                <label
                  key={id}
                  htmlFor={id}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-white/[0.03]"
                  style={{
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  <span className="text-sm text-white/50">{label}</span>
                  <Toggle id={id} checked={checked} onChange={onChange} />
                </label>
              ))}
            </div>
          </div>

          <SectionDivider />

          <ControlRow label="View Layout">
            <StyledSelect
              id="view-select"
              value={viewMode}
              onChange={(v) => onViewModeChange(v as ViewMode)}
            >
              {VIEW_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </StyledSelect>
          </ControlRow>

          <ControlRow label="Delta Format">
            <StyledSelect
              id="delta-select"
              value={deltaFormat}
              onChange={(v) => onDeltaFormatChange(v as DeltaFormat)}
            >
              {DELTA_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </StyledSelect>
          </ControlRow>

          <SectionDivider />

          <div className="grid grid-cols-2 gap-3">
            <ControlRow label="Width (px)">
              <input
                type="number"
                min="100"
                max="1200"
                placeholder="Auto"
                value={badgeWidth}
                onChange={(e) => {
                  const v = e.currentTarget.valueAsNumber;
                  onBadgeWidthChange(Number.isNaN(v) ? '' : v);
                }}
                className="cp-input font-mono"
              />
            </ControlRow>
            <ControlRow label="Height (px)">
              <input
                type="number"
                min="80"
                max="800"
                placeholder="Auto"
                value={badgeHeight}
                onChange={(e) => {
                  const v = e.currentTarget.valueAsNumber;
                  onBadgeHeightChange(Number.isNaN(v) ? '' : v);
                }}
                className="cp-input font-mono"
              />
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

          <SectionDivider />

          <SliderRow
            label="Grace Days"
            value={grace}
            min={0}
            max={7}
            onChange={onGraceChange}
            displayValue={`${grace}d`}
          />

          <ControlRow label="Language">
            <StyledSelect
              id="lang-select"
              value={language}
              onChange={(v) => onLanguageChange(v as Language)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </StyledSelect>
          </ControlRow>
        </div>
      </details>
    </div>
  );
}
