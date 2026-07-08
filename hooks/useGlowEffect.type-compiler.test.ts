import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties } from 'react';
import { useGlowEffect } from './useGlowEffect';

type GlowEffectReturn = ReturnType<typeof useGlowEffect>;

describe('useGlowEffect - TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('shellRef is typed as a ref object with a nullable current property', () => {
    expectTypeOf<GlowEffectReturn['shellRef']>().toHaveProperty('current');
    expectTypeOf<GlowEffectReturn['shellRef']['current']>().toBeNullable();
  });

  it('shellVars is typed as CSSProperties and accepts arbitrary string custom property keys', () => {
    expectTypeOf<GlowEffectReturn['shellVars']>().toMatchTypeOf<CSSProperties>();
    expectTypeOf<GlowEffectReturn['shellVars']>().toMatchTypeOf<Record<string, unknown>>();
  });

  it('handleMouseEnter is typed as a zero-argument function returning void', () => {
    expectTypeOf<GlowEffectReturn['handleMouseEnter']>().toBeFunction();
    expectTypeOf<GlowEffectReturn['handleMouseEnter']>().returns.toBeVoid();
  });

  it('handleMouseMove is typed as a function returning void', () => {
    expectTypeOf<GlowEffectReturn['handleMouseMove']>().toBeFunction();
    expectTypeOf<GlowEffectReturn['handleMouseMove']>().returns.toBeVoid();
  });

  it('handleMouseLeave is typed as a zero-argument void function and the full return shape is structurally complete', () => {
    expectTypeOf<GlowEffectReturn['handleMouseLeave']>().toBeFunction();
    expectTypeOf<GlowEffectReturn['handleMouseLeave']>().returns.toBeVoid();

    expectTypeOf<GlowEffectReturn>().toHaveProperty('shellRef');
    expectTypeOf<GlowEffectReturn>().toHaveProperty('shellVars');
    expectTypeOf<GlowEffectReturn>().toHaveProperty('handleMouseEnter');
    expectTypeOf<GlowEffectReturn>().toHaveProperty('handleMouseMove');
    expectTypeOf<GlowEffectReturn>().toHaveProperty('handleMouseLeave');
  });
});
