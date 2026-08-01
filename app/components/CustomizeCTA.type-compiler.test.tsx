// app/components/CustomizeCTA.type-compiler.test.tsx

import { describe, expect, it, expectTypeOf } from 'vitest';
import type { ReactElement } from 'react';
import { CustomizeCTA } from './CustomizeCTA';

describe('CustomizeCTA TypeScript Compiler Validation', () => {
  it('exports a function component', () => {
    expect(typeof CustomizeCTA).toBe('function');
    expectTypeOf(CustomizeCTA).toBeFunction();
  });

  it('returns a ReactElement', () => {
    expectTypeOf<ReturnType<typeof CustomizeCTA>>().toMatchTypeOf<ReactElement>();
  });

  it('has no required parameters', () => {
    expect(CustomizeCTA.length).toBe(0);
  });

  it('is callable without props', () => {
    expect(() => CustomizeCTA()).not.toThrow();
  });

  it('maintains a stable function signature', () => {
    expectTypeOf<typeof CustomizeCTA>().returns.toMatchTypeOf<ReactElement>();
  });
});
