import { z } from 'zod';

export const streakParamsSchema = z.object({
  // Required — missing user surfaces as "Missing" to match existing tests
  user: z.string({ error: 'Missing user parameter' }).min(1, { message: 'Missing user parameter' }),

  theme: z.string().default('dark'),
  bg: z.string().optional(),
  text: z.string().optional(),
  accent: z.string().optional(),

  // Silently fall back to 'linear' for unknown values (matches old behavior)
  scale: z.enum(['linear', 'log']).catch('linear').default('linear'),

  // Silently fall back to '8s' for invalid format (matches old behavior)
  speed: z
    .string()
    .regex(/^\d+(\.\d+)?s$/)
    .catch('8s')
    .default('8s'),

  radius: z.string().default('8'),
  font: z.string().optional(),
  year: z.string().optional(),
  refresh: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
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
