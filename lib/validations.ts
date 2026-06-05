// lib/validations.ts
import { supportedLanguages } from './i18n/badgeLabels';
import { z } from 'zod';
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
  if (!val) return 'dark';
  const normalized = val.toLowerCase();
  if (normalized === 'auto' || normalized === 'random') {
    return normalized;
  }
  const matchedKey = Object.keys(themes).find((key) => key.toLowerCase() === normalized);
  return matchedKey || 'dark';
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

export function toOpacityValue(val?: string): number {
  if (!val) return 1.0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 1.0 : Math.max(0.1, Math.min(parsed, 1.0));
}

export function toDimensionValue(val?: string): number | undefined {
  return val === undefined ? undefined : Number(val);
}

export function validateGitHubUsername(username: string): boolean {
  return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username);
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

function isValidTimeZone(tz?: string): boolean {
  if (!tz) return true;

  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const timeZoneParam = z
  .string()
  .optional()
  .refine(isValidTimeZone, { message: 'Invalid timezone' });

export const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9]))*$/;

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

  // Silently fall back to 'linear' for unknown values (matches old behavior)
  scale: z.enum(['linear', 'log']).catch('linear').default('linear'),

  // Invalid size values fall back to 'medium' to preserve badge rendering.
  size: z.enum(['small', 'medium', 'large']).catch('medium').default('medium'),

  // to fetch N days contributions
  days: z.coerce.number().int().positive().max(365).optional(),

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
  date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return !isNaN(Date.parse(val));
      },
      { message: 'Invalid "date" format. Use ISO 8601.' }
    ),
  refresh: z.string().optional().transform(toRefreshFlag),
  hide_title: z.string().optional().transform(toBooleanFlag),
  hide_background: z.string().optional().transform(toBooleanFlag),
  hide_stats: z.string().optional().transform(toBooleanFlag),
  lang: z.enum(supportedLanguages).catch('en').default('en'),
  tz: timeZoneParam,
  // Unknown view values fall back to the default dashboard view.
  view: z.enum(['default', 'monthly', 'heatmap', 'pulse']).catch('default').default('default'),
  // Invalid delta formats fall back to percentage mode.
  delta_format: z.enum(['percent', 'absolute', 'both']).catch('percent').default('percent'),
  width: dimensionParam('width', 100, 1200),
  height: dimensionParam('height', 80, 800),
  grace: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val === '') return true;
        return /^\d+$/.test(val) && Number(val) >= 0 && Number(val) <= 7;
      },
      { message: 'grace must be an integer between 0 and 7' }
    )
    .transform((val) => (val === undefined || val === '' ? 1 : Number(val)))
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
    .max(39, { message: 'GitHub username cannot exceed 39 characters' })
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
  gradient_stops: z.string().optional(),
  gradient_dir: z.enum(['vertical', 'horizontal', 'diagonal']).catch('vertical').optional(),
  disable_particles: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),
  // Glow effect — on by default. Accepts 'true'/'1' (true) or 'false' (false).
  glow: z.string().optional().transform(toBooleanFlag).default(true),
  opacity: z.string().optional().transform(toOpacityValue),
  entrance: z.enum(['rise', 'fade', 'slide', 'none']).catch('rise').default('rise'),
  badges: z.string().optional().transform(toBooleanFlag).default(false),

  // Output format: 'svg' (default) or 'json' for programmatic access.
  // Invalid values silently fall back to 'svg'.
  format: z.enum(['svg', 'json']).catch('svg').default('svg'),

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
});

export const streakParamsSchema = baseStreakParamsSchema.refine(
  (data) => !data.from || !data.to || Date.parse(data.from) <= Date.parse(data.to),
  {
    message: '"to" date must be after or equal to "from" date',
    path: ['to'],
  }
);

export const githubParamsSchema = z.object({
  username: z
    .string({ error: 'Missing "username" parameter' })
    .trim()
    .min(1, { message: 'Username is required' })
    .max(39, { message: 'GitHub username cannot exceed 39 characters' })
    .regex(GITHUB_USERNAME_REGEX, {
      message: 'Invalid GitHub username',
    }),
  refresh: z.string().optional().transform(toRefreshFlag),
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
  hide_title: z.string().optional().transform(toBooleanFlag),
  hide_background: z.string().optional().transform(toBooleanFlag), // ✅ Fixed: was toRefreshFlag
  width: dimensionParam('width', 100, 1200),
  height: dimensionParam('height', 80, 800),
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
    .min(1, { message: 'Name and email are required' })
    .max(100, { message: 'Name must be at most 100 characters' }),
  email: z
    .string()
    .trim()
    .min(1, { message: 'Name and email are required' })
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
      items.filter((e) => e.institution || e.degree || e.field || e.startDate || e.endDate)
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
      items.filter((x) => x.company || x.role || x.startDate || x.endDate || x.description)
    ),
});

export type StreakParams = z.infer<typeof streakParamsSchema>;
export type GithubParams = z.infer<typeof githubParamsSchema>;
export type CompareParams = z.infer<typeof compareParamsSchema>;
export type OgParams = z.infer<typeof ogParamsSchema>;
export type StatsParams = z.infer<typeof statsParamsSchema>;
export type WrappedParams = z.infer<typeof wrappedParamsSchema>;
export type NotifyPostParams = z.infer<typeof notifyPostSchema>;
export type NotifyGetParams = z.infer<typeof notifyGetSchema>;
export type ResumeConfirmData = z.infer<typeof resumeConfirmDataSchema>;
