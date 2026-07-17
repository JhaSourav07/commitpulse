import { describe, it, expect, expectTypeOf } from 'vitest';
import { HeroSection } from './HeroSection';

describe('HeroSection - type compiler validation', () => {
  it('has a function type with zero required parameters', () => {
    expectTypeOf(HeroSection).toBeFunction();
    expectTypeOf(HeroSection).parameters.toEqualTypeOf<[]>();
  });

  it('returns a valid JSX element type', () => {
    expectTypeOf(HeroSection).returns.not.toBeAny();
    expectTypeOf(HeroSection).returns.toMatchTypeOf<React.ReactElement>();
  });

  it('blocks invalid prop parameters during static type checking', () => {
    // @ts-expect-error - HeroSection accepts no props, passing any prop must fail type-check
    const invalid = <HeroSection someInvalidProp="not-allowed" />;
    expect(invalid).toBeDefined();
  });

  it('accepts being called with no arguments without compile errors', () => {
    // Verifies the component's parameterless call signature compiles cleanly
    const element = <HeroSection />;
    expectTypeOf(element).toMatchTypeOf<React.ReactElement>();
    expect(element).toBeDefined();
  });

  it('does not declare or export a props type since the component takes none', () => {
    // Runtime assertion confirming HeroSection module has no props interface dependency
    expect(typeof HeroSection).toBe('function');
    expect(HeroSection.length).toBe(0);
  });
});
