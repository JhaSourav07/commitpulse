// lib/validations.ts

import { z } from 'zod';

/**
 * 1. REGISTRATION SCHEMA
 */
export const registrationSchema = z.object({
  name: z.string().trim().min(3, { message: 'Name must be at least 3 characters long.' }),

  email: z.string().trim().email({ message: 'Invalid email format.' }),
import {
  isValidHex,
  sanitizeHexColor,
  sanitizeSpeed,
  sanitizeRadius,
  sanitizeFont,
} from './svg/sanitizer';
import { themes } from './svg/themes';

export function toBooleanFlag(val?: string): boolean {
  return val === 'true' || val === '1';
}

export function toRefreshFlag(val?: string): boolean {
  return val === 'true';
}

export function toEmptyStringAsUndefined(val?: string): string | undefined {
  return val === '' ? undefined : val;
}

export function toValidTheme(val?: string): string | undefined {
  return val && Object.hasOwn(themes, val) ? val : 'dark';
}

export function toValidHexColor(defaultColor: string) {
  return (val?: string): string | undefined =>
    val && isValidHex(val) ? sanitizeHexColor(val, defaultColor) : undefined;
}

export function toGraceValue(val?: string): number {
  if (!val) return 1;
  const parsed = Number(val);
  return isNaN(parsed) ? 1 : Math.max(0, Math.min(parsed, 7));
}

export function toDimensionValue(val?: string): number | undefined {
  return val === undefined ? undefined : Number(val);
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

const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9]))*$/;

export const streakParamsSchema = z.object({
  // Required — missing user surfaces as "Missing" to match existing tests
  user: z
    .string({ error: 'Missing user parameter' })
    .min(1, { message: 'Missing user parameter' })
    .max(39, { message: 'GitHub username cannot exceed 39 characters' })
    .regex(GITHUB_USERNAME_REGEX, {
      message: 'Invalid GitHub username',
    }),

  theme: z.string().default('dark'),
  bg: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/.test(val.replace('#', '')), {
      message: 'bg must be a valid 3 or 6 character hex color without #',
    })
    .transform((val) => (val ? sanitizeHexColor(val, '0d1117') : undefined)),
  text: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/.test(val.replace('#', '')), {
      message: 'text must be a valid 3 or 6 character hex color without #',
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
          'accent must be a valid 3 or 6 character hex color without #, or a comma-separated list of them',
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

  // Silently fall back to 'linear' for unknown values (matches old behavior)
  scale: z.enum(['linear', 'log']).catch('linear').default('linear'),

  // Invalid size values fall back to 'medium' to preserve badge rendering.
  size: z.enum(['small', 'medium', 'large']).catch('medium').default('medium'),

  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .regex(/[A-Z]/, { message: 'Must include at least one uppercase letter.' })
    .regex(/[0-9]/, { message: 'Must include at least one number.' })
    .regex(/[^A-Za-z0-9]/, { message: 'Must include at least one special character.' }),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

/**
 * 2. STREAK PARAMS SCHEMA
 */
export const streakParamsSchema = z.object({
  user: z.string().min(1, { message: 'User is required' }),
  theme: z.string().optional(),
  bg: z.string().optional(),
  text: z.string().optional(),
  accent: z.string().optional(),
  scale: z.string().optional(),
  size: z.string().optional(),
  speed: z.string().optional(),
  radius: z.string().optional(),
  font: z.string().optional(),
  refresh: z.string().optional(),
  hide_title: z.string().optional(),
  hide_background: z.string().optional(),
  hide_stats: z.string().optional(),
  lang: z.string().optional(),
  view: z.string().optional(),
  delta_format: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
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

      const formatErrorMessage = 'Year must be a 4-digit year. GitHub was founded in 2008';
      const foundationErrorMessage = 'GitHub was founded in 2008';

      if (!/^\d{4}$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: formatErrorMessage,
        });
        return;
      }

      const yearNum = parseInt(val, 10);
      const currentYear = Math.max(new Date().getFullYear(), 2026);

      if (yearNum < 2008 || yearNum > currentYear) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: foundationErrorMessage,
        });
      }
    }),
});

export const githubParamsSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  refresh: z
    .preprocess((value) => {
      if (value === 'true' || value === '1') return true;
      if (value === 'false' || value === '0') return false;
      return value;
    }, z.boolean())
    .optional(),
});

export const ogParamsSchema = z.object({
  user: z.string().min(1, { message: 'User is required' }),
});
    ),
  from: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return !isNaN(Date.parse(val));
      },
      { message: 'Invalid "from" date format. Use ISO 8601 (e.g. 2023-01-01).' }
    ),
  to: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return !isNaN(Date.parse(val));
      },
      { message: 'Invalid "to" date format. Use ISO 8601 (e.g. 2023-12-31).' }
    ),
  refresh: z.string().optional().transform(toRefreshFlag),
  hide_title: z.string().optional().transform(toBooleanFlag),
  hide_background: z.string().optional().transform(toBooleanFlag),
  hide_stats: z.string().optional().transform(toBooleanFlag),
  lang: z.string().optional().default('en'),
  // Unknown view values fall back to the default dashboard view.
  view: z.enum(['default', 'monthly']).catch('default').default('default'),
  // Invalid delta formats fall back to percentage mode.
  delta_format: z.enum(['percent', 'absolute', 'both']).catch('percent').default('percent'),
  width: dimensionParam('width', 100, 1200),
  height: dimensionParam('height', 80, 800),
  grace: z.string().optional().transform(toGraceValue).default(1),
  mode: z.enum(['commits', 'loc']).catch('commits').default('commits'),
  repo: z.string().optional(),
  org: z.string().optional(),
  labels: z.string().optional().transform(toBooleanFlag),
  labelColor: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeHexColor(val, '7f8c8d') : undefined)),
  versus: z
    .string()
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
  gradient: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return val === 'true';
    })
    .default(false),
});

export const githubParamsSchema = z.object({
  username: z
    .string({ error: 'Missing "username" parameter' })
    .min(1, { message: 'Username is required' })
    .max(39, { message: 'GitHub username cannot exceed 39 characters' })
    .regex(GITHUB_USERNAME_REGEX, {
      message: 'Invalid GitHub username',
    }),
  refresh: z.string().optional().transform(toRefreshFlag),
});

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
  tz: z.string().optional(),
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
    .refine(
      (val) => {
        if (!val) return true;
        const yearNum = parseInt(val, 10);
        const currentYear = new Date().getFullYear();
        return /^\d{4}$/.test(val) && yearNum >= 2008 && yearNum <= currentYear;
      },
      {
        message: 'GitHub was founded in 2008. Please provide a year of 2008 or later.',
      }
    ),
  theme: z.string().default('dark'),
  bg: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/.test(val.replace('#', '')), {
      message: 'bg must be a valid 3 or 6 character hex color without #',
    })
    .transform((val) => (val ? sanitizeHexColor(val, '0d1117') : undefined)),
  text: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/.test(val.replace('#', '')), {
      message: 'text must be a valid 3 or 6 character hex color without #',
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
          'accent must be a valid 3 or 6 character hex color without #, or a comma-separated list of them',
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
  hide_title: z.string().optional().transform(toBooleanFlag),
  hide_background: z.string().optional().transform(toRefreshFlag),
  width: dimensionParam('width', 100, 1200),
  height: dimensionParam('height', 80, 800),
});

export type StreakParams = z.infer<typeof streakParamsSchema>;
export type GithubParams = z.infer<typeof githubParamsSchema>;
export type OgParams = z.infer<typeof ogParamsSchema>;
export type StatsParams = z.infer<typeof statsParamsSchema>;
export type WrappedParams = z.infer<typeof wrappedParamsSchema>;
