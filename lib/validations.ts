// lib/validations.ts
import { supportedLanguages } from './i18n/badgeLabels';
import { z } from 'zod';
import type { HexColor } from '../types/index';
import {
  isValidHex,
  sanitizeHexColor,
  sanitizeSpeed,
  sanitizeRadius,
  sanitizeFont,
} from './svg/sanitizer';
import { themes } from './svg/themes';

export function coerceQueryParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): Record<string, string | undefined> {
  const coerced: Record<string, string | undefined> = {};

  if (params instanceof URLSearchParams) {
    for (const [key, value] of params.entries()) {
      if (coerced[key] === undefined) {
        coerced[key] = value;
      }
    }
  } else if (params && typeof params === 'object') {
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        coerced[key] = value[0];
      } else if (typeof value === 'string') {
        coerced[key] = value;
      } else {
        coerced[key] = undefined;
      }
    }
  }

  return coerced;
}

export function toBooleanFlag(val?: string): boolean {
  return val === 'true' || val === '1';
}

export function toGlowFlag(val?: string): boolean {
  if (val === undefined) return true;
  return val === 'true' || val === '1';
}

export function toMinifyFlag(val?: string): boolean {
  if (val === undefined) return true;
  return val === 'true' || val === '1';
}

export function toRefreshFlag(val?: string): boolean {
  return val === 'true';
}

export function toEmptyStringAsUndefined(val?: string): string | undefined {
  return val === '' ? undefined : val;
}

export function toValidTheme(val?: string): string | undefined {
  if (!val) return 'dark';
  const normalized = val.toLowerCase();
  if (normalized === 'auto' || normalized === 'random') {
    return normalized;
  }
  const matchedKey = Object.keys(themes).find((key) => key.toLowerCase() === normalized);
  return matchedKey || 'dark';
}

export function toValidHexColor(defaultColor: string) {
  return (val?: string): HexColor | undefined =>
    val && isValidHex(val) ? sanitizeHexColor(val, defaultColor) : undefined;
}

/**
 * Parses the ?grace= URL parameter.
 * Uses parseFloat() — the standard for all numeric URL param parsers in this
 * file — so that partial strings like '2abc' parse as 2 rather than NaN,
 * and empty string correctly returns NaN (triggering the default fallback).
 * Clamps to [0, 7]. Default: 1.
 */
export function toGraceValue(val?: string): number {
  if (!val) return 1;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 1 : Math.max(0, Math.min(parsed, 7));
}

export function toOpacityValue(val?: string): number {
  if (!val) return 1.0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 1.0 : Math.max(0.1, Math.min(parsed, 1.0));
}

export function toDimensionValue(val?: string): number | undefined {
  return val === undefined ? undefined : Number(val);
}

export function validateGitHubUsername(username: string): boolean {
  if (!username || typeof username !== 'string') return false;
  return GITHUB_USERNAME_REGEX.test(username);
}

/**
 * Strict ISO date validation for date-only inputs (YYYY-MM-DD).
 * Validates that the date is a real calendar date by checking:
 * 1. Format matches YYYY-MM-DD
 * 2. Year, month, day are valid ranges
 * 3. Date round-trips correctly (serialization matches input)
 *
 * For non-YYYY-MM-DD formats, falls back to Date.parse validation.
 */
export function validateStrictISODate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  // Check if it matches YYYY-MM-DD format
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    // Strict validation for YYYY-MM-DD format
    const [, yearStr, monthStr, dayStr] = match;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    // Basic range checks
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 2008) return false;

    // Create UTC date and verify it round-trips
    const date = new Date(Date.UTC(year, month - 1, day));
    const serialized = date.toISOString().split('T')[0];

    // Check that the serialized date matches the input
    // This catches invalid dates like Feb 31, Apr 31, etc.
    return serialized === dateStr;
  }

  // For non-YYYY-MM-DD formats, fall back to Date.parse validation
  return !isNaN(Date.parse(dateStr));
}

function dimensionParam(name: string, min: number, max: number) {
  return z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val === undefined) return true;
        if (!/^\d+$/.test(val)) return false;

        const parsed = Number(val);
        return parsed >= min && parsed <= max;
      },
      { message: `${name} must be an integer between ${min} and ${max}` }
    )
    .transform(toDimensionValue);
}

/**
 * Maps raw GMT/UTC offset strings (e.g. "GMT+5", "UTC-3") to the
 * Etc/GMT±N format that Intl.DateTimeFormat accepts.
 *
 * Note: The Etc/GMT sign convention is *inverted* relative to the
 * common GMT± notation — Etc/GMT+5 means UTC−5. This function
 * performs that inversion automatically.
 *
 * Returns the original string unchanged if it doesn't match a raw
 * offset pattern, so callers can pass any timezone string through.
 */
export function normalizeTimezone(tz: string): string {
  // Match patterns: GMT+N, GMT-N, UTC+N, UTC-N (whole hours 0-14)
  const match = tz.match(/^(?:GMT|UTC)([+-])(\d{1,2})$/i);
  if (!match) return tz;

  const sign = match[1];
  const offset = parseInt(match[2], 10);

  // Validate offset range: UTC-12 to UTC+14
  if (offset > 14 || (sign === '-' && offset > 12)) return tz;

  // GMT+0 / UTC+0 → UTC (avoids the Etc/GMT-0 / Etc/GMT+0 ambiguity)
  if (offset === 0) return 'UTC';

  // Invert sign for Etc/GMT convention: GMT+5 → Etc/GMT-5
  const invertedSign = sign === '+' ? '-' : '+';
  return `Etc/GMT${invertedSign}${offset}`;
}

function isValidTimeZone(tz?: string): boolean {
  if (!tz) return true;

  // First try the timezone as-is (covers IANA names and Etc/GMT±N)
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    // Fall through to normalization
  }

  // Try normalizing raw GMT/UTC offsets to Etc/GMT format
  const normalized = normalizeTimezone(tz);
  if (normalized === tz) return false; // No normalization happened, it's invalid

  try {
    Intl.DateTimeFormat(undefined, { timeZone: normalized });
    return true;
  } catch {
    return false;
  }
}

const timeZoneParam = z
  .string()
  .optional()
  .refine(isValidTimeZone, { message: 'Invalid timezone' });

export const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export const githubUsernameSchema = z
  .string({ error: 'Invalid GitHub username' })
  .trim()
  .min(1, { message: 'Invalid GitHub username' })
  .max(39, { message: 'Invalid GitHub username' })
  .regex(GITHUB_USERNAME_REGEX, {
    message: 'Invalid GitHub username',
  });

const baseStreakParamsSchema = z.object({
  // Required — missing user surfaces as "Missing" to match existing tests
  user: z
    .string({ error: 'Missing user parameter' })
    .min(1, { message: 'Missing user parameter' })
    .superRefine((val, ctx) => {
      const users = val.split(',').map((u) => u.trim());
      if (users.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Missing user parameter',
        });
        return;
      }
      for (const u of users) {
        if (u.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid GitHub username',
          });
          return;
        }
        if (u.length > 39) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'GitHub username cannot exceed 39 characters',
          });
          return;
        }
        if (!GITHUB_USERNAME_REGEX.test(u)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid GitHub username',
          });
          return;
        }
      }
    }),

  label: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),

  theme: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return 'dark';
      const normalized = val.toLowerCase();
      if (normalized === 'auto' || normalized === 'random') {
        return normalized;
      }
      const matchedKey = Object.keys(themes).find((key) => key.toLowerCase() === normalized);
      return matchedKey || val;
    })
    .refine(
      (val) => {
        return val === 'auto' || val === 'random' || Object.hasOwn(themes, val);
      },
      {
        message: `Invalid theme. Supported themes: ${['auto', 'random', ...Object.keys(themes)].join(', ')}`,
      }
    )
    .default('dark'),
  bg: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const cleanVal = val.trim().replace(/^#+/, '');
      if (/^([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(cleanVal)) {
        return cleanVal as HexColor;
      }
      return undefined;
    }),
  bgType: z.enum(['solid', 'linear', 'radial']).catch('solid').default('solid'),
  bgStart: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/.test(val.replace('#', '')), {
      message: 'bgStart must be a valid hex color',
    })
    .transform((val) => (val ? sanitizeHexColor(val, '0d1117') : undefined)),
  bgEnd: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/.test(val.replace('#', '')), {
      message: 'bgEnd must be a valid hex color',
    })
    .transform((val) => (val ? sanitizeHexColor(val, '0d1117') : undefined)),
  bgAngle: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val === '') return true;
        const num = Number(val);
        return !isNaN(num) && num >= 0 && num <= 360;
      },
      { message: 'bgAngle must be a number between 0 and 360' }
    )
    .transform((val) => (val === undefined || val === '' ? undefined : Number(val))),
  text: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const cleanVal = val.trim().replace(/^#+/, '');
      if (/^([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(cleanVal)) {
        return cleanVal as HexColor;
      }
      return undefined;
    }),
  accent: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (val.includes(',')) {
        const parts = val
          .split(',')
          .map((c) => c.trim().replace(/^#+/, ''))
          .filter((c) => c.length > 0)
          .filter((c) => /^([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(c))
          .map((c) => c as HexColor)
          .slice(0, 4);
        return parts.length > 0 ? parts : undefined;
      }
      const cleanVal = val.trim().replace(/^#+/, '');
      if (/^([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(cleanVal)) {
        return cleanVal as HexColor;
      }
      return undefined;
    }),

  // Silently fall back to 'linear' for unknown values (matches old behavior)
  scale: z.enum(['linear', 'log', 'sqrt']).catch('linear').default('linear'),

  // Invalid size values fall back to 'medium' to preserve badge rendering.
  size: z.enum(['small', 'medium', 'large']).catch('medium').default('medium'),

  // to fetch N days contributions
  days: z.coerce.number().int().positive().max(366).optional(),

  // Silently fall back to '8s' for invalid format (matches old behavior)
  speed: z
    .string()
    .transform((val) => sanitizeSpeed(val, '8s'))
    .default('8s'),

  // Invalid radius values are sanitized and fall back to 8px.
  radius: z
    .string()
    .transform((val) => sanitizeRadius(val, 8))
    .default(8),
  font: z
    .string()
    .optional()
    .transform((val) => sanitizeFont(val) || undefined),
  year: z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      if (!val) return;
      if (!/^\d{4}$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid year parameter. Must be a 4-digit year (e.g., 2023).',
        });
        return;
      }
      const yearNum = parseInt(val, 10);
      const currentYear = new Date().getUTCFullYear();
      if (yearNum < 2008) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Year ${yearNum} is before GitHub was founded in 2008. Please provide a year of 2008 or later.`,
        });
        return;
      }
      if (yearNum > currentYear) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Year ${yearNum} is in the future. Please provide a year up to ${currentYear}.`,
        });
        return;
      }
    }),
  from: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return validateStrictISODate(val);
      },
      { message: 'Invalid "from" date format. Use ISO 8601 (e.g. 2023-01-01).' }
    ),
  to: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return validateStrictISODate(val);
      },
      { message: 'Invalid "to" date format. Use ISO 8601 (e.g. 2023-12-31).' }
    ),
  start_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return validateStrictISODate(val);
      },
      { message: 'Invalid "start_date" format. Use ISO 8601 (e.g. 2023-01-01).' }
    ),
  end_date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return validateStrictISODate(val);
      },
      { message: 'Invalid "end_date" format. Use ISO 8601 (e.g. 2023-12-31).' }
    ),
  date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return validateStrictISODate(val);
      },
      { message: 'Invalid "date" format. Use ISO 8601.' }
    ),
  refresh: z.string().optional().transform(toRefreshFlag),
  bypassCache: z.string().optional().transform(toRefreshFlag),
  hide_title: z.string().optional().transform(toBooleanFlag),
  custom_title: z
    .string()
    .max(200, { message: 'Title is too long (max 200 characters)' })
    .optional(),
  custom_subtitle: z
    .string()
    .max(200, { message: 'Subtitle is too long (max 200 characters)' })
    .optional(),
  hide_background: z.string().optional().transform(toBooleanFlag),
  hide_stats: z.string().optional().transform(toBooleanFlag),
  lang: z.enum(supportedLanguages).catch('en').default('en'),
  tz: timeZoneParam,
  // Unknown view values fall back to the default dashboard view.
  view: z
    .enum([
      'default',
      'monthly',
      'heatmap',
      'pulse',
      'skyline',
      'languages',
      'constellation',
      'radar',
      'doughnut',
      'pie',
      'activity_graph',
      'commit_clock',
      'activity_graph',
    ])
    .catch('default')
    .default('default'),
  // Invalid delta formats fall back to percentage mode.
  delta_format: z.enum(['percent', 'absolute', 'both']).catch('percent').default('percent'),
  width: dimensionParam('width', 100, 1200),
  height: dimensionParam('height', 80, 800),
  grace: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return 1;
      const n = Number(val);
      if (isNaN(n) || !Number.isInteger(n)) return 1;
      return Math.min(7, Math.max(0, n));
    })
    .default(1),

  mode: z.enum(['commits', 'loc']).catch('commits').default('commits'),
  repo: z.string().optional(),
  org: z
    .string()
    .max(39, { message: 'Organization name cannot exceed 39 characters' })
    .regex(GITHUB_USERNAME_REGEX, {
      message: 'Invalid organization name format',
    })
    .optional(),
  labels: z.string().optional().transform(toBooleanFlag),
  labelColor: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeHexColor(val, '7f8c8d') : undefined)),
  versus: z
    .string()
    .max(39, { message: 'Versus username cannot exceed 39 characters' })
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9]))*$/.test(val);
      },
      { message: 'Invalid versus GitHub username' }
    ),
  shading: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return val === 'true';
    })
    .default(false),
  dim_weekends: z.string().optional().transform(toBooleanFlag).default(false),
  gradient: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return val === 'true';
    })
    .default(false),
  gradient_stops: z
    .string()
    .max(200, {
      message: 'gradient_stops cannot exceed 200 characters',
    })
    .refine((val) => !val || /^[0-9a-fA-F#, ]+$/.test(val), {
      message: 'gradient_stops contains invalid characters',
    })
    .optional(),
  gradient_dir: z.enum(['vertical', 'horizontal', 'diagonal']).catch('vertical').optional(),
  disable_particles: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),

  // Glow effect — on by default. Accepts 'true'/'1' (true) or 'false' (false).
  glow: z.string().optional().transform(toGlowFlag).default(true),

  // SVG optimization — on by default. Accepts 'true'/'1' (true) or 'false' (false).
  minify: z.string().optional().transform(toMinifyFlag).default(true),
  opacity: z.string().optional().transform(toOpacityValue),
  entrance: z
    .enum(['rise', 'fade', 'slide', 'wave', 'bounce', 'none'])
    .catch('rise')
    .default('rise'),
  badges: z.string().optional().transform(toBooleanFlag).default(false),

  // Output format: 'svg' (default), 'json', or 'png' for image export.
  // Invalid values silently fall back to 'svg'.
  format: z.enum(['svg', 'json', 'png']).catch('svg').default('svg'),

  theta: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val === '') return true;
        const num = Number(val);
        return !isNaN(num) && num >= 0 && num <= 360;
      },
      { message: 'theta must be a number between 0 and 360' }
    )
    .transform((val) => (val === undefined || val === '' ? undefined : Number(val))),

  phi: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val === '') return true;
        const num = Number(val);
        return !isNaN(num) && num >= 0 && num <= 90;
      },
      { message: 'phi must be a number between 0 and 90' }
    )
    .transform((val) => (val === undefined || val === '' ? undefined : Number(val))),

  // layout parameter: strictly validated — unsupported values return a 400 Bad Request.
  layout: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val === '') return true;
        return ['default', 'compact', 'full'].includes(val);
      },
      { message: 'Invalid layout format. Supported values: default, compact, full.' }
    )
    .transform((val) => (!val ? undefined : val)),

  // border parameter: optional hex color for SVG badge border stroke
  border: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val === '') return true;
        const cleanVal = val.replace(/^#/, '');
        return /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/.test(cleanVal);
      },
      { message: 'border must be a valid hex color (with or without #)' }
    )
    .transform((val) => {
      if (!val) return undefined;
      return sanitizeHexColor(val, '58a6ff');
    }),
});

export const streakParamsSchema = baseStreakParamsSchema.refine(
  (data) => !data.from || !data.to || Date.parse(data.from) <= Date.parse(data.to),
  {
    message: '"to" date must be after or equal to "from" date',
    path: ['to'],
  }
);

const HEX_REGEX = /^([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;

export const githubParamsSchema = z.object({
  // Preprocess leaves undefined untouched so we can distinguish missing vs empty string
  username: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val),
    z
      .custom<string>()
      .refine((val) => val !== undefined && val !== null, {
        message: 'Missing "username" parameter',
      })
      .transform((val) => String(val))
      .refine((val) => val.length > 0, {
        message: 'Username is required',
      })
      .refine((val) => val.length <= 39, {
        message: 'GitHub username cannot exceed 39 characters',
      })
      .refine((val) => validateGitHubUsername(val), {
        message: 'Invalid GitHub username',
      })
  ),

  bg: z
    .string()
    .optional()
    .transform((val) => val?.replace('#', '') || 'ffffff')
    .refine((val) => HEX_REGEX.test(val))
    .catch('ffffff'),

  accent: z
    .string()
    .optional()
    .transform((val) => val?.replace('#', '') || 'ff6b35')
    .refine((val) => HEX_REGEX.test(val))
    .catch('ff6b35'),

  width: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 400))
    .refine((val) => !isNaN(val) && val >= 100 && val <= 2000)
    .catch(400),

  height: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 150))
    .refine((val) => !isNaN(val) && val >= 100 && val <= 2000)
    .catch(150),

  refresh: z.preprocess((val) => val === 'true', z.boolean()).default(false),
  bypassCache: z.preprocess((val) => val === 'true', z.boolean()).default(false),
});

export const compareParamsSchema = z
  .object({
    user1: z
      .string({ error: 'Missing "user1" parameter' })
      .trim()
      .min(1, { message: 'user1 is required' })
      .max(39, { message: 'GitHub username cannot exceed 39 characters' })
      .regex(GITHUB_USERNAME_REGEX, { message: 'Invalid GitHub username for user1' }),
    user2: z
      .string({ error: 'Missing "user2" parameter' })
      .trim()
      .min(1, { message: 'user2 is required' })
      .max(39, { message: 'GitHub username cannot exceed 39 characters' })
      .regex(GITHUB_USERNAME_REGEX, { message: 'Invalid GitHub username for user2' }),
  })
  .refine(
    (data) => data.user1.localeCompare(data.user2, undefined, { sensitivity: 'base' }) !== 0,
    {
      message: 'Cannot compare a user with themselves.',
      path: ['user2'],
    }
  );

export const ogParamsSchema = z
  .object({
    user: z.string().trim().optional().transform(toEmptyStringAsUndefined),
    username: z.string().trim().optional().transform(toEmptyStringAsUndefined),
    theme: z
      .string()
      .trim()
      .optional()
      .transform(toEmptyStringAsUndefined)
      .transform(toValidTheme)
      .default('dark'),
    bg: z
      .string()
      .trim()
      .optional()
      .transform(toEmptyStringAsUndefined)
      .transform(toValidHexColor('000000')),
    text: z
      .string()
      .trim()
      .optional()
      .transform(toEmptyStringAsUndefined)
      .transform(toValidHexColor('000000')),
    accent: z
      .string()
      .trim()
      .optional()
      .transform(toEmptyStringAsUndefined)
      .transform(toValidHexColor('000000')),
    refresh: z.string().optional().transform(toRefreshFlag),
    bypassCache: z.string().optional().transform(toRefreshFlag),
  })
  .transform((data) => ({
    ...data,
    user: data.user || data.username || 'unknown',
  }));

export const statsParamsSchema = z.object({
  user: z
    .string({ error: 'Missing user parameter' })
    .min(1, { message: 'Missing user parameter' })
    .max(39, { message: 'GitHub username cannot exceed 39 characters' })
    .regex(GITHUB_USERNAME_REGEX, {
      message: 'Invalid GitHub username',
    }),
  refresh: z.string().optional().transform(toRefreshFlag),
  bypassCache: z.string().optional().transform(toRefreshFlag),
  tz: timeZoneParam,
});

export const wrappedParamsSchema = z.object({
  user: z
    .string({ error: 'Missing user parameter' })
    .min(1, { message: 'Missing user parameter' })
    .max(39, { message: 'GitHub username cannot exceed 39 characters' })
    .regex(GITHUB_USERNAME_REGEX, {
      message: 'Invalid GitHub username',
    }),
  year: z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      if (!val) return;
      if (!/^\d{4}$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid year parameter. Must be a 4-digit year (e.g., 2023).',
        });
        return;
      }
      const yearNum = parseInt(val, 10);
      const currentYear = new Date().getUTCFullYear();
      if (yearNum < 2008) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Year ${yearNum} is before GitHub was founded in 2008. Please provide a year of 2008 or later.`,
        });
        return;
      }
      if (yearNum > currentYear) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Year ${yearNum} is in the future. Please provide a year up to ${currentYear}.`,
        });
        return;
      }
    }),
  theme: z.string().optional().transform(toValidTheme).default('dark'),
  bg: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/.test(val.replace('#', '')), {
      message: 'bg must be a valid hex color (with or without #)',
    })
    .transform((val) => (val ? sanitizeHexColor(val, '0d1117') : undefined)),
  text: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/.test(val.replace('#', '')), {
      message: 'text must be a valid hex color (with or without #)',
    })
    .transform((val) => (val ? sanitizeHexColor(val, 'ffffff') : undefined)),
  accent: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const parts = val.includes(',') ? val.split(',') : [val];
        return parts.every((p) =>
          /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/.test(p.trim().replace('#', ''))
        );
      },
      {
        message:
          'accent must be a valid hex color (with or without #), or a comma-separated list of them',
      }
    )
    .transform((val) => {
      if (!val) return undefined;
      if (val.includes(',')) {
        return val
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c.length > 0)
          .slice(0, 4)
          .map((c) => sanitizeHexColor(c, '00ffaa'));
      }
      return sanitizeHexColor(val, '00ffaa');
    }),
  speed: z
    .string()
    .transform((val) => sanitizeSpeed(val, '8s'))
    .default('8s'),
  radius: z
    .string()
    .transform((val) => sanitizeRadius(val, 8))
    .default(8),
  font: z
    .string()
    .optional()
    .transform((val) => sanitizeFont(val) || undefined),
  refresh: z.string().optional().transform(toRefreshFlag),
  bypassCache: z.string().optional().transform(toRefreshFlag),
  hide_title: z.string().optional().transform(toBooleanFlag),
  hide_background: z.string().optional().transform(toBooleanFlag), // ✅ Fixed: was toRefreshFlag
  width: dimensionParam('width', 100, 1200),
  height: dimensionParam('height', 80, 800),
  tz: timeZoneParam,
});

export const notifyPostSchema = z.object({
  username: z
    .string({ error: 'Username is required.' })
    .trim()
    .min(1, { message: 'Username is required.' })
    .max(39, { message: 'GitHub username cannot exceed 39 characters.' })
    .regex(GITHUB_USERNAME_REGEX, {
      message: 'Invalid GitHub username format.',
    }),
  email: z
    .string({ error: 'Email is required.' })
    .trim()
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Invalid email address.' }),
  frequency: z
    .enum(['realtime', 'daily', 'weekly'], {
      message: 'Invalid frequency. Use realtime, daily, or weekly.',
    })
    .default('daily'),
  preferences: z
    .object({
      notifyOnCommit: z.boolean().default(true),
      notifyOnStreak: z.boolean().default(true),
      notifyOnMilestone: z.boolean().default(true),
    })
    .default({
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    }),
  managementToken: z
    .string()
    .trim()
    .min(16)
    .max(256)
    .regex(
      /^cpn_[A-Za-z0-9_-]+$/,
      'Invalid management token format — must start with "cpn_" and be base64url-encoded'
    )
    .optional(),
});

export const notifyGetSchema = z.object({
  user: z
    .string({ error: 'Username is required.' })
    .trim()
    .min(1, { message: 'Username is required.' })
    .max(39, { message: 'GitHub username cannot exceed 39 characters.' })
    .regex(GITHUB_USERNAME_REGEX, {
      message: 'Invalid GitHub username format.',
    }),
});

const resumeTextField = (max: number) => z.string().trim().max(max).default('');

export const resumeConfirmDataSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be at most 100 characters' }),
  email: z
    .string()
    .trim()
    .min(1, { message: 'A valid email address is required' })
    .max(254, { message: 'Email must be at most 254 characters' })
    .email({ message: 'Invalid email address' }),
  phone: z.string().trim().max(40, { message: 'Phone must be at most 40 characters' }).default(''),
  skills: z
    .array(z.string().trim().max(80, { message: 'Each skill must be at most 80 characters' }))
    .max(100, { message: 'Too many skills (max 100)' })
    .default([])
    .transform((items) => items.filter((s) => s.length > 0)),
  education: z
    .array(
      z.object({
        institution: resumeTextField(200),
        degree: resumeTextField(200),
        field: resumeTextField(200),
        startDate: resumeTextField(50),
        endDate: resumeTextField(50),
      })
    )
    .max(50, { message: 'Too many education entries (max 50)' })
    .default([])
    .transform((items) =>
      items.filter(
        (e) =>
          e.institution.length > 0 &&
          e.degree.length > 0 &&
          e.field.length > 0 &&
          e.startDate.length > 0 &&
          e.endDate.length > 0
      )
    ),
  experience: z
    .array(
      z.object({
        company: resumeTextField(200),
        role: resumeTextField(200),
        startDate: resumeTextField(50),
        endDate: resumeTextField(50),
        description: resumeTextField(2000),
      })
    )
    .max(50, { message: 'Too many experience entries (max 50)' })
    .default([])
    .transform((items) =>
      items.filter(
        (x) =>
          x.company.length > 0 &&
          x.role.length > 0 &&
          x.startDate.length > 0 &&
          x.endDate.length > 0
      )
    ),
});

export const reviewPostSchema = z.object({
  name: z
    .string({ error: 'Name is required.' })
    .trim()
    .min(1, { message: 'Name is required.' })
    .max(100, { message: 'Name must be at most 100 characters.' }),
  handle: z
    .string({ error: 'Handle is required.' })
    .trim()
    .min(1, { message: 'Handle is required.' })
    .max(50, { message: 'Handle must be at most 50 characters.' })
    .regex(/^@?[\w.-]+$/, { message: 'Handle must be a valid username.' }),
  platform: z.enum(['twitter', 'github'], {
    message: 'Platform must be twitter or github.',
  }),
  message: z
    .string({ error: 'Message is required.' })
    .trim()
    .min(10, { message: 'Message must be at least 10 characters.' })
    .max(1000, { message: 'Message must be at most 1000 characters.' }),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, { message: 'Accent color must be a valid hex color.' })
    .default('#10b981'),
});

export type ReviewPostParams = z.infer<typeof reviewPostSchema>;

export type StreakParams = z.infer<typeof streakParamsSchema>;
export type GithubParams = z.infer<typeof githubParamsSchema>;
export type CompareParams = z.infer<typeof compareParamsSchema>;
export type OgParams = z.infer<typeof ogParamsSchema>;
export type StatsParams = z.infer<typeof statsParamsSchema>;
export type WrappedParams = z.infer<typeof wrappedParamsSchema>;
export type NotifyPostParams = z.infer<typeof notifyPostSchema>;
export type NotifyGetParams = z.infer<typeof notifyGetSchema>;
export type ResumeConfirmData = z.infer<typeof resumeConfirmDataSchema>;
