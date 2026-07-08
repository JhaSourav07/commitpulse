import { describe, it, expectTypeOf, expect } from 'vitest';
import type { NextRequest } from 'next/server';

import { GET } from './route';
import { ogParamsSchema } from '@/lib/validations';

describe('OG Route Type Compiler Validation', () => {
  it('exports a GET handler with the correct signature', () => {
    expectTypeOf(GET).toBeFunction();
    expectTypeOf<Parameters<typeof GET>>().toEqualTypeOf<[NextRequest]>();
    expectTypeOf<ReturnType<typeof GET>>().toEqualTypeOf<Promise<Response>>();
  });

  it('accepts a NextRequest parameter', () => {
    expectTypeOf<Parameters<typeof GET>[0]>().toEqualTypeOf<NextRequest>();
  });

  it('returns a Promise<Response>', () => {
    expectTypeOf<Awaited<ReturnType<typeof GET>>>().toEqualTypeOf<Response>();
  });

  it('validates the OG parameter schema output type', () => {
    const result = ogParamsSchema.safeParse({
      user: 'octocat',
      theme: 'dark',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expectTypeOf(result.data).toHaveProperty('user');
      expectTypeOf(result.data).toHaveProperty('theme');
      expectTypeOf(result.data).toHaveProperty('bg');
      expectTypeOf(result.data).toHaveProperty('text');
      expectTypeOf(result.data).toHaveProperty('accent');
      expectTypeOf(result.data).toHaveProperty('refresh');
      expectTypeOf(result.data).toHaveProperty('bypassCache');
    }
  });

  it('rejects invalid schema input at runtime', () => {
    const result = ogParamsSchema.safeParse({
      user: '',
      theme: 123,
    });

    expect(result.success).toBe(false);
  });
});
