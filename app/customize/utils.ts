import type { CustomizeOptions, ExportFormat } from './types';
import type { Scale, BadgeSize, Font, ViewMode, DeltaFormat, Language, Timezone } from './types';
import { SPEEDS, SIZES, FONTS, VIEW_MODES, DELTA_FORMATS, LANGUAGES, TIMEZONES } from './types';

const BADGE_BASE_URL = 'https://commitpulse.vercel.app/api/streak';

/**
 * Removes the leading # from a hex color string.
 * Used specifically for color picker handling in the customize interface.
 */
export function stripHash(val: string): string {
  return val.replace(/^#/, '');
}

/**
 * Validates if a string is a valid 6-digit hex color for the color picker.
 * Intentionally strict (6-digit only) for color customization.
 * Note: lib/svg/sanitizer.ts has a more flexible version supporting 3,4,6,8 digits for SVG theming.
 */
export function isValidHex(value: string): boolean {
  return /^[0-9a-fA-F]{6}$/.test(stripHash(value));
}

export function getBadgeUrl(queryString: string): string {
  return `${BADGE_BASE_URL}?${queryString}`;
}

/**
 * Maps a failed /api/streak preview response status to a user-facing message.
 * A 400 means invalid parameters (for example a bad color), not a missing user.
 */
export function streakErrorMessage(status: number): string {
  if (status === 404) return 'GitHub user not found';
  if (status === 400) return 'Invalid customization options';
  if (status === 429) return 'Rate limit exceeded. Please try again later.';
  return 'Failed to load badge';
}

export function getExportSnippet(format: ExportFormat, queryString: string): string {
  const badgeUrl = getBadgeUrl(queryString);

  // Extract username from query string for descriptive alt text
  const usernameMatch = queryString?.match(/(?:^|&)user=([^&]+)/);
  const username = usernameMatch ? usernameMatch[1] : null;
  const altText =
    queryString === undefined
      ? 'CommitPulse'
      : username
        ? `CommitPulse Contribution Graph for ${username}`
        : 'CommitPulse Contribution Graph';

  if (format === 'action') {
    return [
      'name: CommitPulse Streak Badge',
      '',
      'on:',
      '  push:',
      '    branches:',
      "      - '**'",
      '  schedule:',
      "    - cron: '0 0 * * *' # Runs daily at midnight",
      '  workflow_dispatch:',
      '',
      'jobs:',
      '  update-badge:',
      '    runs-on: ubuntu-latest',
      '    if: "!contains(github.event.head_commit.message, \'chore: update CommitPulse badge\')"',
      '    permissions:',
      '       contents: write',
      '    env:',
      '      FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - name: Fetch CommitPulse Badge',
      `        run: curl -o commitpulse.svg "${badgeUrl}"`,
      '      - name: Commit Badge',
      '        uses: stefanzweifel/git-auto-commit-action@v5',
      '        with:',
      '          commit_message: "chore: update CommitPulse badge"',
      '          file_pattern: commitpulse.svg',
    ].join('\n');
  }

  if (format === 'html') {
    return `<img src="${badgeUrl}" alt="${altText}" />`;
  }

  if (format === 'markdown') {
    return `![${altText}](${badgeUrl})`;
  }

  if (format === 'tsx') {
    return [
      "'use client';",
      '',
      "import React, { useState, useEffect } from 'react';",
      '',
      'interface CommitPulseProps extends React.HTMLAttributes<HTMLDivElement> {',
      '  username?: string;',
      '  theme?: string;',
      '  height?: string | number;',
      '  width?: string | number;',
      '}',
      '',
      'export function CommitPulse({',
      '  username,',
      '  theme,',
      '  height,',
      '  width,',
      '  className,',
      '  style,',
      '  ...props',
      '}: CommitPulseProps) {',
      "  const [svgContent, setSvgContent] = useState<string>('');",
      '  const [loading, setLoading] = useState<boolean>(true);',
      '  const [error, setError] = useState<string | null>(null);',
      '',
      '  useEffect(() => {',
      '    setLoading(true);',
      '    setError(null);',
      '',
      `    const params = new URLSearchParams("${queryString}");`,
      "    if (username) params.set('user', username);",
      '    if (theme) {',
      "      params.set('theme', theme);",
      "      params.delete('bg');",
      "      params.delete('accent');",
      "      params.delete('text');",
      '    }',
      "    if (width) params.set('width', width.toString());",
      "    if (height) params.set('height', height.toString());",
      '',
      `    const url = \`${BADGE_BASE_URL}?\${params.toString()}\`;`,
      '',
      '    const controller = new AbortController();',
      '    fetch(url, { signal: controller.signal })',
      '      .then((res) => {',
      '        if (!res.ok) {',
      '          throw new Error(\`Failed to load streak badge: \${res.statusText}\`);',
      '        }',
      '        return res.text();',
      '      })',
      '      .then((data) => {',
      '        setSvgContent(data);',
      '        setLoading(false);',
      '      })',
      '      .catch((err) => {',
      "        if (err.name !== 'AbortError') {",
      '          console.error(err);',
      "          setError(err.message || 'Failed to load badge');",
      '          setLoading(false);',
      '        }',
      '      });',
      '',
      '    return () => controller.abort();',
      '  }, [username, theme, width, height]);',
      '',
      '  return (',
      '    <div',
      '      className={className}',
      '      style={{',
      "        display: 'inline-block',",
      "        width: width || '100%',",
      "        height: height || 'auto',",
      "        minHeight: loading ? '100px' : undefined,",
      '        ...style,',
      '      }}',
      '      {...props}',
      '    >',
      '      {loading && (',
      '        <div',
      '          style={{',
      "            display: 'flex',",
      "            alignItems: 'center',",
      "            justifyContent: 'center',",
      "            height: '100%',",
      "            width: '100%',",
      '            opacity: 0.5,',
      "            fontFamily: 'monospace',",
      "            fontSize: '12px',",
      '          }}',
      '        >',
      '          Loading CommitPulse...',
      '        </div>',
      '      )}',
      '      {error && (',
      '        <div',
      '          style={{',
      "            display: 'flex',",
      "            alignItems: 'center',",
      "            justifyContent: 'center',",
      "            height: '100%',",
      "            width: '100%',",
      "            color: '#ef4444',",
      "            fontFamily: 'monospace',",
      "            fontSize: '12px',",
      '          }}',
      '        >',
      '          {error}',
      '        </div>',
      '      )}',
      '      {!loading && !error && svgContent && (',
      '        <div',
      "          style={{ width: '100%', height: '100%' }}",
      '          className="[&>svg]:w-full [&>svg]:h-auto"',
      '          dangerouslySetInnerHTML={{ __html: svgContent }}',
      '        />',
      '      )}',
      '    </div>',
      '  );',
      '}',
    ].join('\n');
  }

  throw new Error(`Unsupported export format: ${format}`);
}

export function getPlaceholderSnippet(format: ExportFormat): string {
  return getExportSnippet(format, 'user=your-github-username');
}

export function buildQueryParams(options: CustomizeOptions): string {
  const params = new URLSearchParams();

  const trimmedUsername = options.username.trim();
  const hasUsername = trimmedUsername.length > 0;

  if (hasUsername) {
    params.set('user', trimmedUsername);
  }

  const isAutoTheme = options.theme === 'auto';
  const isRandomTheme = options.theme === 'random';
  const skipsCustomColors = isAutoTheme || isRandomTheme;

  if (skipsCustomColors) {
    // Virtual themes always emit theme=<name> and skip custom color params.
    params.set('theme', options.theme);
  } else {
    const hasValidBg = isValidHex(options.bgHex);
    const hasValidAccent = isValidHex(options.accentHex);
    const hasValidText = isValidHex(options.textHex);
    const hasCustomColors = hasValidBg || hasValidAccent || hasValidText;

    // Only complete, valid hex colors take priority over theme; partial input falls back to theme.
    if (!hasCustomColors) {
      params.set('theme', options.theme);
    }
    if (hasValidBg) params.set('bg', stripHash(options.bgHex));
    if (options.bgType && options.bgType !== 'solid') {
      params.set('bgType', options.bgType);
      if (isValidHex(options.bgStart)) params.set('bgStart', stripHash(options.bgStart));
      if (isValidHex(options.bgEnd)) params.set('bgEnd', stripHash(options.bgEnd));
      if (options.bgType === 'linear' && options.bgAngle !== undefined && options.bgAngle !== 90) {
        params.set('bgAngle', options.bgAngle.toString());
      }
    }
    if (hasValidAccent) params.set('accent', stripHash(options.accentHex));
    if (hasValidText) params.set('text', stripHash(options.textHex));
  }

  if (options.scale !== 'linear') params.set('scale', options.scale);
  if (options.speed !== '8s') params.set('speed', options.speed);
  if (options.font && options.font !== 'Inter') params.set('font', options.font);
  if (options.year) params.set('year', options.year);
  if (options.radius !== 8) params.set('radius', options.radius.toString());
  if (options.size !== 'medium') params.set('size', options.size);

  if (options.hideTitle) params.set('hide_title', 'true');
  if (options.hideBackground) params.set('hide_background', 'true');
  if (options.hideStats) params.set('hide_stats', 'true');
  if (options.viewMode !== 'default') params.set('view', options.viewMode);
  if (options.deltaFormat !== 'percent') params.set('delta_format', options.deltaFormat);
  if (options.badgeWidth !== '') params.set('width', options.badgeWidth.toString());
  if (options.badgeHeight !== '') params.set('height', options.badgeHeight.toString());
  if (options.grace !== 1) params.set('grace', options.grace.toString());
  if (options.language !== 'en') params.set('lang', options.language);
  if (options.timezone !== 'UTC') params.set('tz', options.timezone);

  return params.toString();
}

// ─── Config Export / Import ────────────────────────────────────────────────

/** Bumped whenever the schema gains or removes fields in a breaking way. */
export const CONFIG_SCHEMA_VERSION = 1 as const;

export interface ConfigFileV1 {
  version: 1;
  config: CustomizeOptions;
}

/**
 * Serialises the current form state to a versioned JSON blob and triggers
 * an immediate browser download as `commitpulse-config.json`.
 */
export function exportConfig(options: CustomizeOptions): void {
  const payload: ConfigFileV1 = {
    version: CONFIG_SCHEMA_VERSION,
    config: options,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'commitpulse-config.json';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Union of all valid SPEED values (for runtime validation). */
const VALID_SPEEDS = SPEEDS.map((s) => s.value) as string[];
/** Union of all valid SIZE values. */
const VALID_SIZES = SIZES.map((s) => s.value) as string[];
/** Union of all valid FONT values. */
const VALID_FONTS = FONTS.map((f) => f.value) as string[];
/** Union of all valid VIEW_MODE values. */
const VALID_VIEW_MODES = VIEW_MODES.map((v) => v.value) as string[];
/** Union of all valid DELTA_FORMAT values. */
const VALID_DELTA_FORMATS = DELTA_FORMATS.map((d) => d.value) as string[];
/** Union of all valid LANGUAGE values. */
const VALID_LANGUAGES = LANGUAGES.map((l) => l.value) as string[];
/** Union of all valid TIMEZONE values. */
const VALID_TIMEZONES = TIMEZONES.map((t) => t.value) as string[];

function isString(v: unknown): v is string {
  return typeof v === 'string';
}
function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}
function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
function isNumericOrEmpty(v: unknown): v is number | '' {
  return v === '' || (isFiniteNumber(v) && Number.isInteger(v));
}

/**
 * Default values used as fallbacks when an imported field is missing or invalid.
 * Mirrors the initial state in page.tsx so round-trip fidelity is guaranteed.
 */
const CONFIG_DEFAULTS: CustomizeOptions = {
  username: '',
  theme: 'dark',
  bgHex: '',
  bgType: 'solid',
  bgStart: '',
  bgEnd: '',
  bgAngle: 90,
  accentHex: '',
  textHex: '',
  scale: 'linear',
  speed: '8s',
  font: 'Inter',
  year: '',
  radius: 8,
  size: 'medium',
  hideTitle: false,
  hideBackground: false,
  hideStats: false,
  viewMode: 'default',
  deltaFormat: 'percent',
  badgeWidth: '',
  badgeHeight: '',
  grace: 1,
  language: 'en',
  timezone: 'UTC',
};

/**
 * Parses and validates a raw JSON string (typically the text content of a
 * `.json` file chosen by the user) and returns a fully-typed `CustomizeOptions`
 * object on success, or a user-facing error string on failure.
 *
 * - Unknown fields are silently ignored (forward-compat).
 * - Invalid or missing fields fall back to defaults (graceful degradation).
 * - Only the version envelope and the `config` key are strictly required.
 */
export function importConfig(
  raw: string
): { ok: true; options: CustomizeOptions } | { ok: false; error: string } {
  // 1. Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Invalid JSON: the file could not be parsed.' };
  }

  // 2. Top-level shape
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'Invalid config file: expected a JSON object at the top level.' };
  }

  const root = parsed as Record<string, unknown>;

  // 3. Version field
  if (!('version' in root)) {
    return { ok: false, error: 'Invalid config file: missing required "version" field.' };
  }
  if (root.version !== CONFIG_SCHEMA_VERSION) {
    // Future versions get a graceful message; we still attempt to import below.
    // For now only v1 exists, so any other value is an error.
    return {
      ok: false,
      error: `Unsupported config version "${String(root.version)}". Expected version ${CONFIG_SCHEMA_VERSION}.`,
    };
  }

  // 4. Config key
  if (!('config' in root) || typeof root.config !== 'object' || root.config === null) {
    return { ok: false, error: 'Invalid config file: missing or malformed "config" object.' };
  }

  const c = root.config as Record<string, unknown>;

  // 5. Field-level validation with safe fallbacks
  const username = isString(c.username) ? c.username : CONFIG_DEFAULTS.username;
  const theme = isString(c.theme) && c.theme.length > 0 ? c.theme : CONFIG_DEFAULTS.theme;

  const bgTypeRaw = c.bgType;
  const bgType =
    bgTypeRaw === 'solid' || bgTypeRaw === 'linear' || bgTypeRaw === 'radial'
      ? bgTypeRaw
      : CONFIG_DEFAULTS.bgType;

  const bgHex = isString(c.bgHex) ? c.bgHex : CONFIG_DEFAULTS.bgHex;
  const bgStart = isString(c.bgStart) ? c.bgStart : CONFIG_DEFAULTS.bgStart;
  const bgEnd = isString(c.bgEnd) ? c.bgEnd : CONFIG_DEFAULTS.bgEnd;
  const bgAngle =
    isFiniteNumber(c.bgAngle) && c.bgAngle >= 0 && c.bgAngle <= 360
      ? c.bgAngle
      : CONFIG_DEFAULTS.bgAngle;

  const accentHex = isString(c.accentHex) ? c.accentHex : CONFIG_DEFAULTS.accentHex;
  const textHex = isString(c.textHex) ? c.textHex : CONFIG_DEFAULTS.textHex;

  // Scale must be one of 'linear' | 'log' | 'sqrt'
  const scaleClean: Scale =
    isString(c.scale) && ['linear', 'log', 'sqrt'].includes(c.scale)
      ? (c.scale as Scale)
      : CONFIG_DEFAULTS.scale;

  const speed =
    isString(c.speed) && VALID_SPEEDS.includes(c.speed) ? c.speed : CONFIG_DEFAULTS.speed;
  const font: Font =
    isString(c.font) && (VALID_FONTS.includes(c.font) || c.font.length > 0)
      ? (c.font as Font)
      : CONFIG_DEFAULTS.font;
  const year = isString(c.year) ? c.year : CONFIG_DEFAULTS.year;
  const radius =
    isFiniteNumber(c.radius) && c.radius >= 0 && c.radius <= 50 ? c.radius : CONFIG_DEFAULTS.radius;
  const size: BadgeSize =
    isString(c.size) && VALID_SIZES.includes(c.size) ? (c.size as BadgeSize) : CONFIG_DEFAULTS.size;

  const hideTitle = isBoolean(c.hideTitle) ? c.hideTitle : CONFIG_DEFAULTS.hideTitle;
  const hideBackground = isBoolean(c.hideBackground)
    ? c.hideBackground
    : CONFIG_DEFAULTS.hideBackground;
  const hideStats = isBoolean(c.hideStats) ? c.hideStats : CONFIG_DEFAULTS.hideStats;

  const viewMode: ViewMode =
    isString(c.viewMode) && VALID_VIEW_MODES.includes(c.viewMode)
      ? (c.viewMode as ViewMode)
      : CONFIG_DEFAULTS.viewMode;
  const deltaFormat: DeltaFormat =
    isString(c.deltaFormat) && VALID_DELTA_FORMATS.includes(c.deltaFormat)
      ? (c.deltaFormat as DeltaFormat)
      : CONFIG_DEFAULTS.deltaFormat;

  const badgeWidth = isNumericOrEmpty(c.badgeWidth) ? c.badgeWidth : CONFIG_DEFAULTS.badgeWidth;
  const badgeHeight = isNumericOrEmpty(c.badgeHeight) ? c.badgeHeight : CONFIG_DEFAULTS.badgeHeight;
  const grace =
    isFiniteNumber(c.grace) && c.grace >= 0 && c.grace <= 7 ? c.grace : CONFIG_DEFAULTS.grace;

  const language: Language =
    isString(c.language) && VALID_LANGUAGES.includes(c.language)
      ? (c.language as Language)
      : CONFIG_DEFAULTS.language;
  const timezone: Timezone =
    isString(c.timezone) && VALID_TIMEZONES.includes(c.timezone)
      ? (c.timezone as Timezone)
      : CONFIG_DEFAULTS.timezone;

  const options: CustomizeOptions = {
    username,
    theme,
    bgHex,
    bgType,
    bgStart,
    bgEnd,
    bgAngle,
    accentHex,
    textHex,
    scale: scaleClean,
    speed,
    font,
    year,
    radius,
    size,
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
  };
  return { ok: true, options };
}
