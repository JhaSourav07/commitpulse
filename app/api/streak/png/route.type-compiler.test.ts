// app/api/streak/png/route.type-compiler.test.ts
// Purpose: Verify TypeScript Compiler Validation & Schema Constraints Stability
// for the streak PNG API route. These tests ensure that the validation schema (streakParamsSchema)
// and its inferred type (StreakParams) used by the route are stable and compile correctly.

import { describe, expect, it, expectTypeOf } from 'vitest';
import { streakParamsSchema, coerceQueryParams } from '@/lib/validations';
import type { StreakParams } from '@/lib/validations';

describe('ApiStreakPngRoute - TypeScript Compiler Validation & Schema Constraints Stability (Variation 10)', () => {
  // Test 1: Import surface & baseline property checks
  it('imports streakParamsSchema and StreakParams type successfully and matches core parameters', () => {
    expect(streakParamsSchema).toBeDefined();
    expect(typeof streakParamsSchema.safeParse).toBe('function');

    // Structural check to verify standard fields are present
    expectTypeOf<StreakParams>().toHaveProperty('user');
    expectTypeOf<StreakParams>().toHaveProperty('theme');
    expectTypeOf<StreakParams>().toHaveProperty('format');
  });

  // Test 2: Enforce field property configurations
  it('enforces correct field property configurations via expectTypeOf assertions', () => {
    // Required fields
    expectTypeOf<StreakParams['user']>().toEqualTypeOf<string>();

    // Format must support 'png' as a valid option
    expectTypeOf<StreakParams['format']>().toEqualTypeOf<'svg' | 'json' | 'png'>();

    // Other core configurations
    expectTypeOf<StreakParams['theme']>().toEqualTypeOf<string>();
    expectTypeOf<StreakParams['view']>().toEqualTypeOf<
      | 'default'
      | 'monthly'
      | 'heatmap'
      | 'pulse'
      | 'skyline'
      | 'languages'
      | 'constellation'
      | 'radar'
      | 'doughnut'
      | 'pie'
      | 'activity_graph'
      | 'commit_clock'
      | 'weekday'
    >();
    expectTypeOf<StreakParams['scale']>().toEqualTypeOf<'linear' | 'log' | 'sqrt'>();
    expectTypeOf<StreakParams['size']>().toEqualTypeOf<'small' | 'medium' | 'large'>();
  });

  // Test 3: Assert that invalid prop parameters are blocked during static type checking
  it('blocks invalid prop parameters during static type checking', () => {
    type InvalidStreakParamsType = {
      user: number; // user must be string
      format: 'jpeg'; // format must be 'svg' | 'json' | 'png'
    };

    expectTypeOf<InvalidStreakParamsType>().not.toMatchTypeOf<StreakParams>();

    // Verify parser rejects invalid structures at runtime
    const parsedInvalid = streakParamsSchema.safeParse({
      user: 12345,
    });
    expect(parsedInvalid.success).toBe(false);
  });

  // Test 4: Verify custom types accept optional values without compile errors
  it('accepts optional type parameters as undefined without compile errors', () => {
    const minimalRawInput = coerceQueryParams(new URLSearchParams('user=octocat'));
    const result = streakParamsSchema.safeParse(minimalRawInput);

    expect(result.success).toBe(true);
    if (result.success) {
      // Check that optional fields default to their expected types or are undefined
      expect(result.data.border).toBeUndefined();
      expect(result.data.bg).toBeUndefined();
      expect(result.data.accent).toBeUndefined();
      expect(result.data.repo).toBeUndefined();
      expect(result.data.org).toBeUndefined();

      expectTypeOf(result.data.border).toEqualTypeOf<import('@/types').HexColor | undefined>();
      expectTypeOf(result.data.bg).toEqualTypeOf<import('@/types').HexColor | undefined>();
      expectTypeOf(result.data.bgType).toEqualTypeOf<'solid' | 'linear' | 'radial'>();
      expectTypeOf(result.data.repo).toEqualTypeOf<string | undefined>();
    }
  });

  // Test 5: Verify schema validation constraints return strict validation reports
  it('returns strict validation reports when schema constraints are violated', () => {
    // 1. Missing user parameter
    const missingUser = streakParamsSchema.safeParse({});
    expect(missingUser.success).toBe(false);
    if (!missingUser.success) {
      const issue = missingUser.error.issues.find((i) => i.path[0] === 'user');
      expect(issue?.message).toMatch(/Missing user parameter/i);
    }

    // 2. Too long username (> 39 chars)
    const tooLongUser = streakParamsSchema.safeParse({ user: 'a'.repeat(40) });
    expect(tooLongUser.success).toBe(false);
    if (!tooLongUser.success) {
      const issue = tooLongUser.error.issues.find((i) => i.path[0] === 'user');
      expect(issue?.message).toMatch(/cannot exceed 39 characters/i);
    }

    // 3. Invalid layout format
    const invalidLayout = streakParamsSchema.safeParse({ user: 'octocat', layout: 'invalid' });
    expect(invalidLayout.success).toBe(false);
    if (!invalidLayout.success) {
      const issue = invalidLayout.error.issues.find((i) => i.path[0] === 'layout');
      expect(issue?.message).toMatch(/Invalid layout format/i);
    }

    // 4. Invalid border hex color
    const invalidBorder = streakParamsSchema.safeParse({ user: 'octocat', border: 'not-hex' });
    expect(invalidBorder.success).toBe(false);
    if (!invalidBorder.success) {
      const issue = invalidBorder.error.issues.find((i) => i.path[0] === 'border');
      expect(issue?.message).toMatch(/border must be a valid hex color/i);
    }

    // 5. Invalid date constraint (to < from)
    const invalidDate = streakParamsSchema.safeParse({
      user: 'octocat',
      from: '2024-12-31',
      to: '2024-01-01',
    });
    expect(invalidDate.success).toBe(false);
    if (!invalidDate.success) {
      const issue = invalidDate.error.issues.find((i) => i.path[0] === 'to');
      expect(issue?.message).toMatch(/"to" date must be after or equal to "from" date/i);
    }
  });
});
