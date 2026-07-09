import { describe, it, expectTypeOf, expect } from 'vitest';
import { statsParamsSchema } from '@/lib/validations';

describe('Stats Route Type Compiler Validation', () => {
  it('validates stats response object structure', () => {
    type StatsResponse = {
      totalContributions: number;
      longestStreak: number;
      currentStreak: number;
    };

    expectTypeOf<StatsResponse>().toEqualTypeOf<{
      totalContributions: number;
      longestStreak: number;
      currentStreak: number;
    }>();
  });

  it('validates timezone parameter as optional string', () => {
    type StatsParams = {
      user: string;
      tz?: string;
    };

    expectTypeOf<StatsParams>().toMatchTypeOf<{
      user: string;
      tz?: string;
    }>();
  });

  it('validates refresh query parameter type', () => {
    const result = statsParamsSchema.safeParse({
      user: 'octocat',
      refresh: 'true',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expectTypeOf(result.data.user).toBeString();
      expectTypeOf(result.data.refresh).toBeBoolean();
    }
  });

  it('rejects invalid schema input', () => {
    const result = statsParamsSchema.safeParse({
      user: '',
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid schema input', () => {
    const result = statsParamsSchema.safeParse({
      user: 'octocat',
      tz: 'America/New_York',
      refresh: 'false',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expectTypeOf(result.data.user).toBeString();
      expectTypeOf(result.data.tz).toEqualTypeOf<string | undefined>();
      expectTypeOf(result.data.refresh).toBeBoolean();
    }
  });
});
