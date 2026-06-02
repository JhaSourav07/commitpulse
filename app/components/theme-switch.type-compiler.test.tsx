import { describe, expectTypeOf, it } from 'vitest';
import { createAnimation, type AnimationStart, type AnimationVariant } from './theme-switch';

describe('ThemeSwitch Type Compiler Validation', () => {
  it('validates AnimationVariant union values', () => {
    expectTypeOf<AnimationVariant>().toEqualTypeOf<
      'circle' | 'rectangle' | 'gif' | 'polygon' | 'circle-blur'
    >();
  });

  it('validates AnimationStart type', () => {
    expectTypeOf<AnimationStart>().toBeString();
  });

  it('ensures createAnimation returns required structure', () => {
    const animation = createAnimation('circle');

    expectTypeOf(animation.name).toBeString();
    expectTypeOf(animation.css).toBeString();
  });

  it('accepts optional parameters without compile errors', () => {
    const animation = createAnimation('circle');

    expectTypeOf(animation.name).toBeString();
    expectTypeOf(animation.css).toBeString();
  });

  it('accepts valid exported types in createAnimation', () => {
    const variant: AnimationVariant = 'circle';
    const start: AnimationStart = 'center';

    const animation = createAnimation(variant, start);

    expectTypeOf(animation.name).toBeString();
    expectTypeOf(animation.css).toBeString();
  });
});
