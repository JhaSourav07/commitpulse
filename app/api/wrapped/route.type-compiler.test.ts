// app/api/wrapped/route.type-compiler.test.ts
// Purpose: Verify TypeScript Compiler Validation & Schema Constraints Stability
// for the wrapped API route. These tests ensure the Zod schema (wrappedParamsSchema)
// and its inferred type (WrappedParams) remain stable across refactors — catching
// regressions in field types, optional flags, and validation constraint reports.

import { describe, expect, it, expectTypeOf } from 'vitest';
import { wrappedParamsSchema, coerceQueryParams } from '@/lib/validations';
import type { WrappedParams } from '@/lib/validations';

describe('ApiWrappedRoute - TypeScript Compiler Validation & Schema Constraints Stability', () => {
  // Test 1: Import surface — ensures the schema and its inferred type are exported
  // and callable. If someone renames the export or breaks the Zod inference chain,
  // this test fails to compile.
  it('imports wrappedParamsSchema and the inferred WrappedParams type without compile errors', () => {
    expect(wrappedParamsSchema).toBeDefined();
    expect(typeof wrappedParamsSchema.safeParse).toBe('function');

    // Compile-time assertion: the inferred type must expose a `user` key.
    // If the schema drifts (e.g. user is removed), tsc rejects this line.
    expectTypeOf<WrappedParams>().toHaveProperty('user');
  });

  // Test 2: Field property configurations — locks in the presence and general shape
  // of every key the route consumes. Using `.toHaveProperty` (structural check)
  // avoids brittle equality with Zod's literal-heavy inferred unions.
  it('enforces correct field property configurations via expectTypeOf assertions', () => {
    // Required field
    expectTypeOf<WrappedParams>().toHaveProperty('user');

    // Optional fields — the schema declares these as .optional()
    expectTypeOf<WrappedParams>().toHaveProperty('year');
    expectTypeOf<WrappedParams>().toHaveProperty('font');
    expectTypeOf<WrappedParams>().toHaveProperty('tz');
    expectTypeOf<WrappedParams>().toHaveProperty('bg');
    expectTypeOf<WrappedParams>().toHaveProperty('text');
    expectTypeOf<WrappedParams>().toHaveProperty('accent');
    expectTypeOf<WrappedParams>().toHaveProperty('width');
    expectTypeOf<WrappedParams>().toHaveProperty('height');

    // Boolean flags produced by the .transform() chain
    expectTypeOf<WrappedParams['refresh']>().toEqualTypeOf<boolean>();
    expectTypeOf<WrappedParams['bypassCache']>().toEqualTypeOf<boolean>();
    expectTypeOf<WrappedParams['hide_title']>().toEqualTypeOf<boolean>();
    expectTypeOf<WrappedParams['hide_background']>().toEqualTypeOf<boolean>();

    // `user` is a required, non-optional string
    expectTypeOf<WrappedParams['user']>().toEqualTypeOf<string>();
  });

  // Test 3: Invalid prop parameters must be blocked during static type checking.
  // We build a fully valid object and then verify that runtime narrowing on the
  // parsed result also holds at the type level. If the schema type ever loosens
  // to `any`, expectTypeOf assertions below will fail to compile.
  it('blocks invalid prop parameters during static type checking', () => {
    // Runtime + type-level parse — the returned data is strictly typed as
    // WrappedParams, never `any`. This is the guardrail for the route handler.
    const parsed = wrappedParamsSchema.safeParse(
      coerceQueryParams(new URLSearchParams('user=octocat'))
    );

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      // The parsed data must be strongly typed — never `any`.
      expectTypeOf(parsed.data).not.toBeAny();
      expectTypeOf(parsed.data.user).toEqualTypeOf<string>();
      expectTypeOf(parsed.data.refresh).toEqualTypeOf<boolean>();
    }

    // Runtime rejection of an invalid numeric user — schema treats input as string
    // and the .regex check fails, proving invalid shapes never leak through.
    const numericUser = wrappedParamsSchema.safeParse({ user: 12345 });
    expect(numericUser.success).toBe(false);
  });

  // Test 4: Custom/optional types must accept `undefined` without compile errors.
  // The schema marks year, font, tz, bg, text, accent, width, height as optional.
  // Omitting them must both parse successfully at runtime and satisfy tsc.
  it('accepts optional/custom type values as undefined without compile errors', () => {
    const minimalRawInput = coerceQueryParams(new URLSearchParams('user=octocat'));
    const result = wrappedParamsSchema.safeParse(minimalRawInput);

    expect(result.success).toBe(true);
    if (result.success) {
      // Optional fields must be `undefined` when the caller omits them —
      // never `null`, never a thrown error.
      expect(result.data.year).toBeUndefined();
      expect(result.data.font).toBeUndefined();
      expect(result.data.tz).toBeUndefined();
      expect(result.data.bg).toBeUndefined();
      expect(result.data.text).toBeUndefined();
      expect(result.data.accent).toBeUndefined();
      expect(result.data.width).toBeUndefined();
      expect(result.data.height).toBeUndefined();

      // Compile-time assertion: `year` is optional — its type must include `undefined`.
      expectTypeOf(result.data.year).toEqualTypeOf<string | undefined>();
    }
  });

  // Test 5: Schema constraint violations must return strict, structured validation
  // reports (not throw, not return partial data). This is the safety-net that the
  // route.ts handler relies on to build its 400 response with field-level details.
  it('returns strict validation reports when schema constraints are violated', () => {
    // Invalid username (spaces + special chars fail GITHUB_USERNAME_REGEX)
    const invalidUser = wrappedParamsSchema.safeParse(
      coerceQueryParams(new URLSearchParams('user=invalid user!!'))
    );
    expect(invalidUser.success).toBe(false);
    if (!invalidUser.success) {
      const userIssue = invalidUser.error.issues.find((i) => i.path[0] === 'user');
      expect(userIssue?.message).toMatch(/invalid github username/i);
    }

    // Invalid year — non-numeric format is rejected by the superRefine check
    const invalidYear = wrappedParamsSchema.safeParse(
      coerceQueryParams(new URLSearchParams('user=octocat&year=abcd'))
    );
    expect(invalidYear.success).toBe(false);
    if (!invalidYear.success) {
      const yearIssue = invalidYear.error.issues.find((i) => i.path[0] === 'year');
      expect(yearIssue?.message).toMatch(/4-digit year/i);
    }

    // Year before GitHub existed (2008) — validates the lower-bound constraint
    const preGithubYear = wrappedParamsSchema.safeParse(
      coerceQueryParams(new URLSearchParams('user=octocat&year=1999'))
    );
    expect(preGithubYear.success).toBe(false);
    if (!preGithubYear.success) {
      const yearIssue = preGithubYear.error.issues.find((i) => i.path[0] === 'year');
      expect(yearIssue?.message).toMatch(/2008/);
    }

    // Invalid hex color for `bg` — refine rule blocks non-hex strings
    const invalidBg = wrappedParamsSchema.safeParse(
      coerceQueryParams(new URLSearchParams('user=octocat&bg=notAColor'))
    );
    expect(invalidBg.success).toBe(false);
    if (!invalidBg.success) {
      const bgIssue = invalidBg.error.issues.find((i) => i.path[0] === 'bg');
      expect(bgIssue?.message).toMatch(/valid hex color/i);
    }

    // Missing user parameter — surfaces the "Missing user parameter" message that
    // route.ts relies on to build its 400 JSON response.
    const missingUser = wrappedParamsSchema.safeParse(coerceQueryParams(new URLSearchParams('')));
    expect(missingUser.success).toBe(false);
    if (!missingUser.success) {
      const userIssue = missingUser.error.issues.find((i) => i.path[0] === 'user');
      expect(userIssue?.message).toMatch(/missing user parameter/i);
    }
  });
});
