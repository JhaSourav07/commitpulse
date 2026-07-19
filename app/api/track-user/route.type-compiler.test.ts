import { describe, expect, it, expectTypeOf } from 'vitest';
import type { NextResponse } from 'next/server';
import * as route from './route';
import react from 'react';

describe('track-user route TypeScript Compiler Validation', () => {
  it('exports POST handler', () => {
    expect(route.POST).toBeDefined();
    expect(typeof route.POST).toBe('function');

    expectTypeOf(route.POST).toBeFunction();
  });

  it('exports OPTIONS handler', () => {
    expect(route.OPTIONS).toBeDefined();
    expect(typeof route.OPTIONS).toBe('function');

    expectTypeOf(route.OPTIONS).toBeFunction();
  });

  it('POST accepts a Request parameter', () => {
    expectTypeOf<typeof route.POST>().parameters.toEqualTypeOf<[Request]>();
  });

  it('OPTIONS accepts a Request parameter', () => {
    expectTypeOf<typeof route.OPTIONS>().parameters.toEqualTypeOf<[Request]>();
  });

  it('route handlers return Promise<NextResponse>', () => {
    expectTypeOf<ReturnType<typeof route.POST>>().toMatchTypeOf<Promise<Response>>();

    expectTypeOf<ReturnType<typeof route.OPTIONS>>().toMatchTypeOf<Promise<Response>>();
  });
});
