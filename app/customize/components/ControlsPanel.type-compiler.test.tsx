import { describe, it, expectTypeOf } from 'vitest';
import type { ComponentProps } from 'react';
import type { Scale, BadgeSize, Font } from '../types';
import { SIZES, FONTS, SPEEDS } from '../types';
import { ControlsPanel } from './ControlsPanel';

describe('ControlsPanel TypeScript compiler validation & schema constraints', () => {
  it('Scale accepts only "linear" | "log" | "sqrt" and rejects other literals', () => {
    expectTypeOf<Scale>().toEqualTypeOf<'linear' | 'log' | 'sqrt'>();

    // @ts-expect-error - 'exponential' is not a member of the Scale union
    const invalidScale: Scale = 'exponential';
    void invalidScale;
  });

  it('BadgeSize accepts only "small" | "medium" | "large" and rejects other literals', () => {
    expectTypeOf<BadgeSize>().toEqualTypeOf<'small' | 'medium' | 'large'>();

    // @ts-expect-error - 'xl' is not a member of the BadgeSize union
    const invalidSize: BadgeSize = 'xl';
    void invalidSize;
  });

  it('Font widens to a plain string, so any custom font name compiles without error', () => {
    expectTypeOf<Font>().toEqualTypeOf<string>();

    const preset: Font = 'jetbrains';
    const custom: Font = 'Comic Sans MS';
    expectTypeOf(preset).toBeString();
    expectTypeOf(custom).toBeString();
  });

  it('SIZES and FONTS option values stay assignable to their corresponding exported types', () => {
    expectTypeOf<(typeof SIZES)[number]['value']>().toEqualTypeOf<BadgeSize>();
    expectTypeOf<(typeof FONTS)[number]['value']>().toExtend<Font>();
    expectTypeOf<(typeof SPEEDS)[number]['value']>().toExtend<string>();
  });

  it('ControlsPanel props require literal-typed scale/bgType/size and keep inherited div props optional', () => {
    type Props = ComponentProps<typeof ControlsPanel>;

    expectTypeOf<Props['scale']>().toEqualTypeOf<Scale>();
    expectTypeOf<Props['bgType']>().toEqualTypeOf<'solid' | 'linear' | 'radial'>();
    expectTypeOf<Props['size']>().toEqualTypeOf<BadgeSize>();
    expectTypeOf<Props['className']>().toEqualTypeOf<string | undefined>();

    // @ts-expect-error - 'diagonal' is not part of the bgType union
    const invalidProps: Pick<Props, 'bgType'> = { bgType: 'diagonal' };
    void invalidProps;
  });
});
