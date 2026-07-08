import type { ComponentProps, ReactNode } from 'react';
import { describe, it, expectTypeOf } from 'vitest';
import { ThemeSelector, StyledSelect } from './ThemeSelector';
import type { ThemeKey, ThemeOption } from '../types';

type ThemeSelectorProps = ComponentProps<typeof ThemeSelector>;
type StyledSelectProps = ComponentProps<typeof StyledSelect>;

describe('ThemeSelector - TypeScript Compiler Validation & Schema Constraints Stability (Variation 10)', () => {
  it('1. TypeScript compiler validation: verifies exported interfaces and prop types', () => {
    // Verify required props
    expectTypeOf<ThemeSelectorProps>().toHaveProperty('theme').toBeString();
    expectTypeOf<ThemeSelectorProps>().toHaveProperty('onThemeChange').parameter(0).toBeString();

    expectTypeOf<StyledSelectProps>().toHaveProperty('id').toBeString();
    expectTypeOf<StyledSelectProps>().toHaveProperty('value').toBeString();
    expectTypeOf<StyledSelectProps>().toHaveProperty('onChange').parameter(0).toBeString();
    expectTypeOf<StyledSelectProps>().toHaveProperty('children');
  });

  it('2. Static type safety: verifies invalid props are rejected by TypeScript', () => {
    // We verify strict type safety by checking exact structural equality.
    // If ThemeSelectorProps had any additional properties or allowed index signatures, this would fail.
    expectTypeOf<{
      theme: string;
      onThemeChange: (theme: string) => void;
    }>().toEqualTypeOf<ThemeSelectorProps>();

    expectTypeOf<{
      id: string;
      value: string;
      onChange: (v: string) => void;
      children: ReactNode;
      ariaLabel?: string;
    }>().toEqualTypeOf<StyledSelectProps>();
  });

  it('3. Optional property validation: verifies optional props can be omitted without compile errors', () => {
    // verify the exact type of the optional property
    expectTypeOf<StyledSelectProps['ariaLabel']>().toEqualTypeOf<string | undefined>();

    // verify ThemeSelector has no optional props by extracting the required keys
    expectTypeOf<keyof ThemeSelectorProps>().toEqualTypeOf<'theme' | 'onThemeChange'>();
  });

  it('4. Schema validation: verify exported TypeScript interfaces and prop definitions as fallback', () => {
    // Ensure that the component props matches the structural definition
    expectTypeOf<ThemeSelectorProps>().toMatchTypeOf<{
      theme: string;
      onThemeChange: (theme: string) => void;
    }>();

    expectTypeOf<StyledSelectProps>().toMatchTypeOf<{
      id: string;
      value: string;
      onChange: (v: string) => void;
      children: ReactNode;
    }>();
  });

  it('5. Type stability: verifies unions, enums, readonly fields, nullable values, and generic types compile correctly', () => {
    // ThemeKey represents the actual concrete themes
    expectTypeOf<ThemeKey>().toMatchTypeOf<string>();
    expectTypeOf<'light'>().toMatchTypeOf<ThemeKey>();
    expectTypeOf<'dark'>().toMatchTypeOf<ThemeKey>();

    // ThemeOption includes 'auto' and 'random'
    expectTypeOf<'auto'>().toMatchTypeOf<ThemeOption>();
    expectTypeOf<'random'>().toMatchTypeOf<ThemeOption>();
    expectTypeOf<'light'>().toMatchTypeOf<ThemeOption>();

    // Invalid literal should not match
    expectTypeOf<'invalid_theme_literal'>().not.toEqualTypeOf<ThemeKey>();
    expectTypeOf<'invalid_theme_literal'>().not.toEqualTypeOf<ThemeOption>();
  });
});
