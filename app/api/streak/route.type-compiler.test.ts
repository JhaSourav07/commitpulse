import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';
import { streakParamsSchema } from '@/lib/validations';

type StreakParams = z.infer<typeof streakParamsSchema>;

describe('ApiStreakRoute - TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('infers a valid TypeScript type from streakParamsSchema', () => {
    expectTypeOf<StreakParams>().toMatchTypeOf<StreakParams>();

    expectTypeOf<StreakParams>().toHaveProperty('user');
    expectTypeOf<StreakParams>().toHaveProperty('theme');
    expectTypeOf<StreakParams>().toHaveProperty('view');
    expectTypeOf<StreakParams>().toHaveProperty('format');
    expectTypeOf<StreakParams>().toHaveProperty('scale');
  });

  it('accepts minimal valid input and applies schema defaults', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
    });

    expect(result.success).toBe(true);

    if (!result.success) return;

    expect(result.data.user).toBe('octocat');
    expect(result.data.theme).toBe('dark');
    expect(result.data.view).toBe('default');
    expect(result.data.format).toBe('svg');
    expect(result.data.scale).toBe('linear');
    expect(result.data.size).toBe('medium');
  });

  it('accepts optional parameters without validation errors', () => {
    const result = streakParamsSchema.safeParse({
      user: 'octocat',
      border: '#58a6ff',
      bg: '#0d1117',
      accent: '#58a6ff',
      repo: 'commitpulse',
      org: 'vercel',
    });

    expect(result.success).toBe(true);

    if (!result.success) return;

    expect(result.data.border).toBeDefined();
    expect(result.data.bg).toBeDefined();
    expect(result.data.accent).toBeDefined();
    expect(result.data.repo).toBe('commitpulse');
    expect(result.data.org).toBe('vercel');
  });

  it('rejects invalid schema inputs with strict validation errors', () => {
    const usernameResult = streakParamsSchema.safeParse({
      user: 'a'.repeat(40),
    });

    expect(usernameResult.success).toBe(false);

    if (!usernameResult.success) {
      expect(
        usernameResult.error.issues.some((issue) =>
          issue.message.includes('cannot exceed 39 characters')
        )
      ).toBe(true);
    }

    const borderResult = streakParamsSchema.safeParse({
      user: 'octocat',
      border: 'not-a-color',
    });

    expect(borderResult.success).toBe(false);

    if (!borderResult.success) {
      expect(borderResult.error.issues[0].message).toContain('border');
    }

    const dateResult = streakParamsSchema.safeParse({
      user: 'octocat',
      from: '2024-12-31',
      to: '2024-01-01',
    });

    expect(dateResult.success).toBe(false);

    if (!dateResult.success) {
      expect(dateResult.error.issues[0].path).toContain('to');
      expect(dateResult.error.issues[0].message).toContain(
        '"to" date must be after or equal to "from" date'
      );
    }
  });

  it('applies schema transforms and fallback values correctly', () => {
    const parsed = streakParamsSchema.parse({
      user: 'octocat',
      speed: 'fast',
      grace: '-5',
      view: 'unsupported-view',
      scale: 'unsupported-scale',
      format: 'jpeg',
    });

    expect(parsed.speed).toBe('8s');
    expect(parsed.grace).toBe(0);
    expect(parsed.view).toBe('default');
    expect(parsed.scale).toBe('linear');
    expect(parsed.format).toBe('svg');
  });
});
