import type { ReactElement } from 'react';
import {
  LANGUAGES,
  TIMEZONES,
  VIEW_MODES,
  DELTA_FORMATS,
  type ViewMode,
  type DeltaFormat,
  type Language,
  type Timezone,
} from '../types';
import { SectionLabel } from './SectionLabel';
import { StyledSelect } from './ThemeSelector';

function ControlRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

export function AdvancedSettingsPanel({
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
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400 mb-4">
        Advanced Settings
      </p>

      <div className="flex flex-col gap-5">
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
              className="w-full min-w-0 bg-white/60 backdrop-blur-md border border-black/10 dark:bg-black/40 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-black dark:text-emerald-300 placeholder:text-gray-400 dark:placeholder:text-white/20 outline-none focus:border-emerald-500/50 transition-colors"
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
              className="w-full min-w-0 bg-white/60 backdrop-blur-md border border-black/10 dark:bg-black/40 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-black dark:text-emerald-300 placeholder:text-gray-400 dark:placeholder:text-white/20 outline-none focus:border-emerald-500/50 transition-colors"
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
          <div className="flex justify-between text-sm text-gray-500 dark:text-white/20">
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
    </div>
  );
}
