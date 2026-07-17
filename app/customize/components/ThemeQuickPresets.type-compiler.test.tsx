import { describe, expectTypeOf, it } from 'vitest';
import type { ComponentProps } from 'react';

import { ThemeQuickPresets } from './ThemeQuickPresets';

type Props = ComponentProps<typeof ThemeQuickPresets>;

describe('ThemeQuickPresets Type Compiler Validation', () => {
  it('accepts valid prop types', () => {
    expectTypeOf<Props['theme']>().toEqualTypeOf<string>();
    expectTypeOf<Props['onThemeChange']>().toEqualTypeOf<(theme: string) => void>();
  });

  it('validates callback parameter type', () => {
    expectTypeOf<Props['onThemeChange']>().parameters.toEqualTypeOf<[string]>();
  });

  it('returns void from callback', () => {
    expectTypeOf<Props['onThemeChange']>().returns.toEqualTypeOf<void>();
  });

  it('allows valid theme values without compile errors', () => {
    const props: Props = {
      theme: 'dark',
      onThemeChange: () => {},
    };

    expectTypeOf(props).toEqualTypeOf<Props>();
  });

  it('enforces strict property configuration', () => {
    expectTypeOf<keyof Props>().toEqualTypeOf<'theme' | 'onThemeChange'>();
  });
});
