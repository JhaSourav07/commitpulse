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

export function toGlowFlag(val?: string): boolean {
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
  return (val?: string): string | undefined =>
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
  .refine(isValidTimeZone, { message: 'Invalid timezone parameter layout structure' });

export const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9]))*$/;

const baseStreakParamsSchema = z.object({
  user: z
    .string()
    .min(1, { message: 'Missing user parameter layout' })
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
        message: `Invalid theme layout. Supported themes: ${['auto', 'random', ...Object.keys(themes)].join(', ')}`,
      }
    )
    .default('dark'),
  bg: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/.test(val.replace('#', '')), {
      message: 'bg must be a valid hex color string format (with or without #)',
    })
    .transform((val) => (val ? sanitizeHexColor(val, '0d1117') : undefined)),
  text: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/.test(val.replace('#', '')), {
      message: 'text must be a valid hex color string format (with or without #)',
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
          'accent must be a valid hex color string format (with or without #), or a comma-separated list',
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

  scale: z.enum(['linear', 'log']).catch('linear').default('linear'),
  size: z.enum(['small', 'medium', 'large']).catch('medium').default('medium'),
  days: z.coerce.number().int().positive().max(365).optional(),

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
      { message: 'Invalid "from" ISO date format configuration parameters.' }
    ),
  to: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return !isNaN(Date.parse(val));
      },
      { message: 'Invalid "to" ISO date format configuration parameters.' }
    ),
  date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return !isNaN(Date.parse(val));
      },
      { message: 'Invalid snapshot "date" format sequence.' }
    ),
  refresh: z.string().optional().transform(toRefreshFlag),
  bypassCache: z.string().optional().transform(toRefreshFlag),
  hide_title: z.string().optional().transform(toBooleanFlag),
  hide_background: z.string().optional().transform(toBooleanFlag),
  hide_stats: z.string().optional().transform(toBooleanFlag),
  lang: z.enum(supportedLanguages).catch('en').default('en'),
  tz: timeZoneParam,
  view: z
    .enum(['default', 'monthly', 'heatmap', 'pulse', 'languages', 'constellation'])
    .catch('default')
    .default('default'),
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
      { message: 'grace parameter setup details must be an integer bounds between 0 and 7' }
    )
    .transform((val) => (val === undefined || val === '' ? 1 : Number(val)))
    .default(1),

  mode: z.enum(['commits', 'loc']).catch('commits').default('commits'),
  repo: z.string().optional(),
  org: z
    .string()
    .max(39, { message: 'Organization structural lookup name cannot exceed 39 characters' })
    .regex(GITHUB_USERNAME_REGEX, {
      message: 'Invalid organization target tracking identifier format layout setup',
    })
    .optional(),
  labels: z.string().optional().transform(toBooleanFlag),
  labelColor: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeHexColor(val, '7f8c8d') : undefined)),
  versus: z
    .string()
    .max(39, { message: 'Versus tracking handle values cannot exceed 39 characters' })
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9]))*$/.test(val);
      },
      { message: 'Invalid user target parameter verification format sequences' }
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
      message: 'gradient_stops length parameters cannot exceed 200 characters limit bounds',
    })
    .optional(),
  gradient_dir: z.enum(['vertical', 'horizontal', 'diagonal']).catch('vertical').optional(),
  disable_particles: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),

  glow: z.string().optional().transform(toGlowFlag).default(true),
  opacity: z.string().optional().transform(toOpacityValue),
  entrance: z.enum(['rise', 'fade', 'slide', 'none']).catch('rise').default('rise'),
  badges: z.string().optional().transform(toBooleanFlag).default(false),
  format: z.enum(['svg', 'json']).catch('svg').default('svg'),
  layout: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val === '') return true;
        return ['default', 'compact', 'full'].includes(val);
      },
      {
        message:
          'Invalid choice options sequence template. Supported setup matches include: default, compact, full.',
      }
    )
    .transform((val) => (!val ? undefined : val)),
});

export const streakParamsSchema = baseStreakParamsSchema.refine(
  (data) => !data.from || !data.to || Date.parse(data.from) <= Date.parse(data.to),
  {
    message:
      '"to" date range limits parameters configuration must be ahead of or identical to "from" metrics target positions',
    path: ['to'],
  }
);

export const githubParamsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, { message: 'Username parameter verification sequence remains completely required' })
    .max(39, {
      message: 'GitHub tracking handle length parameters cannot exceed 39 characters bounds',
    })
    .regex(GITHUB_USERNAME_REGEX, {
      message: 'Invalid user lookup profile metadata identifier schema parsing details sequence',
    }),
  refresh: z.string().optional().transform(toRefreshFlag),
  bypassCache: z.string().optional().transform(toRefreshFlag),
});

export const compareParamsSchema = z
  .object({
    user1: z
      .string()
      .trim()
      .min(1, {
        message: 'user1 details identification metrics sequences are required context data points',
      })
      .max(39, {
        message: 'GitHub tracking handle length parameters cannot exceed 39 characters bounds',
      })
      .regex(GITHUB_USERNAME_REGEX, {
        message: 'Invalid target query path settings profiles options details',
      }),
    user2: z
      .string()
      .trim()
      .min(1, {
        message: 'user2 details identification metrics sequences are required context data points',
      })
      .max(39, {
        message: 'GitHub tracking handle length parameters cannot exceed 39 characters bounds',
      })
      .regex(GITHUB_USERNAME_REGEX, {
        message: 'Invalid target query path settings profiles options details',
      }),
  })
  .refine(
    (data) => data.user1.localeCompare(data.user2, undefined, { sensitivity: 'base' }) !== 0,
    {
      message:
        'Cannot process a comparison operation evaluating a single tracking identity criteria profile record against itself.',
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
    .string()
    .min(1, { message: 'Missing required lookup profile key variables context' })
    .max(39, {
      message: 'GitHub tracking handle length parameters cannot exceed 39 characters bounds',
    })
    .regex(GITHUB_USERNAME_REGEX, {
      message: 'Invalid profile identity string validation format match sequences',
    }),
  refresh: z.string().optional().transform(toRefreshFlag),
  bypassCache: z.string().optional().transform(toRefreshFlag),
  tz: timeZoneParam,
});

export const wrappedParamsSchema = z.object({
  user: z
    .string()
    .min(1, {
      message: 'Missing target data validation tracking identifiers options records structure',
    })
    .max(39, {
      message: 'GitHub tracking handle length parameters cannot exceed 39 characters bounds',
    })
    .regex(GITHUB_USERNAME_REGEX, {
      message: 'Invalid target account verification strings structural layouts data points',
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
        message:
          'GitHub systems track verification records matching founding year bounds from 2008 or later periods.',
      }
    ),
  theme: z.string().optional().transform(toValidTheme).default('dark'),
  bg: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/.test(val.replace('#', '')), {
      message:
        'bg hex color sequence validations parameters matching requirements formats bounds metrics errors',
    })
    .transform((val) => (val ? sanitizeHexColor(val, '0d1117') : undefined)),
  text: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/.test(val.replace('#', '')), {
      message:
        'text hex color sequence validations parameters matching requirements formats bounds metrics errors',
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
          'accent highlight definitions requirements expect accurate hex string notations inputs data arrays elements matches profiles',
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
  hide_background: z.string().optional().transform(toBooleanFlag),
  width: dimensionParam('width', 100, 1200),
  height: dimensionParam('height', 80, 800),
});

export const notifyPostSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, {
      message:
        'Username validation values missing parameters sequence tracking conditions records error.',
    })
    .max(39, {
      message: 'GitHub tracking handle length parameters cannot exceed 39 characters bounds',
    })
    .regex(GITHUB_USERNAME_REGEX, {
      message:
        'Invalid entry characters layout specifications structures options values fields inputs.',
    }),
  email: z
    .string()
    .trim()
    .min(1, { message: 'Email address field tracking points are fully required inputs details.' })
    .email({
      message:
        'Invalid layout formatting rules configuration matching context specifications rules properties.',
    }),
  frequency: z
    .enum(['realtime', 'daily', 'weekly'], {
      message:
        'Invalid structural tracking settings choices matching parameters lists definitions boundaries.',
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
    .string()
    .trim()
    .min(1, {
      message: 'Username values missing parameter sequences metrics paths configurations.',
    })
    .max(39, {
      message: 'GitHub tracking handle length parameters cannot exceed 39 characters bounds',
    })
    .regex(GITHUB_USERNAME_REGEX, {
      message: 'Invalid verification syntax profile lookup properties components.',
    }),
});

const resumeTextField = (max: number) => z.string().trim().max(max).default('');

export const resumeConfirmDataSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Name and email specification context vectors remain entirely required.' })
    .max(100, {
      message: 'Name values parameter length metrics caps at 100 characters max bounds.',
    }),
  email: z
    .string()
    .trim()
    .min(1, { message: 'Name and email specification context vectors remain entirely required.' })
    .max(254, {
      message:
        'Email fields parameters tracking dimensions length restrictions peak limits at 254 bounds.',
    })
    .email({
      message:
        'Invalid destination verification electronic mail transfer identity addresses formats definitions.',
    }),
  phone: z
    .string()
    .trim()
    .max(40, {
      message:
        'Phone input records configurations length controls match up to 40 characters maximum restrictions',
    })
    .default(''),
  skills: z
    .array(
      z
        .string()
        .trim()
        .max(80, {
          message:
            'Individual array skill string entry limits check points boundary at 80 characters.',
        })
    )
    .max(100, {
      message:
        'Too many text metrics values. Array entry volume thresholds ceiling controls maximize at 100 entries.',
    })
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
    .max(50, {
      message:
        'Too many historical structural context record logs. Tracking array slots parameter peaks at 50 slots.',
    })
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
    .max(50, {
      message:
        'Too many historical structural context record logs. Tracking array slots parameter peaks at 50 slots.',
    })
    .default([])
    .transform((items) =>
      items.filter((x) => x.company || x.role || x.startDate || x.endDate || x.description)
    ),
});

export const reviewPostSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, {
      message:
        'Name value entries parameters requirements specification blocks are structurally mandatory.',
    })
    .max(100, {
      message:
        'Name metrics fields length restrictions cap bound points reach 100 character limits maximum.',
    }),
  handle: z
    .string()
    .trim()
    .min(1, {
      message:
        'Identity key system validation handle parameters blocks remain structurally required entries.',
    })
    .max(50, {
      message:
        'System tracking profile handles length values ceilings check boundary properties at 50 parameters max limits.',
    })
    .regex(/^@?[\w.-]+$/, {
      message:
        'Profile network context structural handle paths metrics must resolve to completely valid string paths configurations.',
    }),
  platform: z.enum(['twitter', 'github'], {
    message:
      'Destination validation routes choice operations expect parameters explicitly assigning matching keywords like twitter or github.',
  }),
  message: z
    .string()
    .trim()
    .min(10, {
      message:
        'Text input string configurations message content parameters details scale from 10 characters minimums.',
    })
    .max(1000, {
      message:
        'Text input string configurations message content parameters details restrict up to 1000 characters maximums.',
    }),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, {
      message:
        'Design system styling options values expect parameters conforming strictly to hex layout sequences formats configurations.',
    })
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
