import { z } from 'zod';

/**
 * 1. REGISTRATION SCHEMA
 */
export const registrationSchema = z.object({
  name: z.string().trim().min(3, { message: 'Name must be at least 3 characters long.' }),

  email: z.string().trim().email({ message: 'Invalid email format.' }),

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
