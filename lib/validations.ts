import { z } from 'zod';
import { sanitizeHexColor, sanitizeSpeed, sanitizeRadius, sanitizeFont } from './svg/sanitizer';

export const streakParamsSchema = z.object({
  // Required — missing user surfaces as "Missing" to match existing tests
  user: z.string({ error: 'Missing user parameter' }).min(1, { message: 'Missing user parameter' }),

  theme: z.string().default('dark'),
  bg: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeHexColor(val, '0d1117') : undefined)),
  text: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeHexColor(val, 'ffffff') : undefined)),
  accent: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeHexColor(val, '00ffaa') : undefined)),

  // Silently fall back to 'linear' for unknown values (matches old behavior)
  scale: z.enum(['linear', 'log']).catch('linear').default('linear'),

  size: z.enum(['small', 'medium', 'large']).catch('medium').default('medium'),

  // Silently fall back to '8s' for invalid format (matches old behavior)
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
    .regex(/^\d{4}$/, {
      message: 'Invalid "year" parameter. Use YYYY format, e.g. 2024.',
    })
    .refine(
      (year) => {
        const yearNum = parseInt(year, 10);
        const currentYear = new Date().getFullYear();

        return yearNum >= 2005 && yearNum <= currentYear;
      },
      {
        message: 'Invalid "year" parameter. Use YYYY format, e.g. 2024.',
      }
    )
    .optional(),
  refresh: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  hide_title: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),

  hide_background: z
    .string()
    .optional()
    .transform((val) => val === 'true'),

  hide_stats: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),
  lang: z.string().optional().default('en'),
});

export const githubParamsSchema = z.object({
  username: z
    .string({ error: 'Missing "username" parameter' })
    .min(1, { message: 'Username is required' }),
  refresh: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export const ogParamsSchema = z.object({
  user: z.string().optional().default('unknown'),
});

export type StreakParams = z.infer<typeof streakParamsSchema>;
export type GithubParams = z.infer<typeof githubParamsSchema>;
export type OgParams = z.infer<typeof ogParamsSchema>;
