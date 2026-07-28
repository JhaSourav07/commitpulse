import React from 'react';
import { describe, it, expectTypeOf } from 'vitest';
import { TechnologyGraph } from './TechnologyGraph';

describe('TechnologyGraph Type Compiler Validation', () => {
  it('accepts selected as a string array', () => {
    type Props = React.ComponentProps<typeof TechnologyGraph>;

    expectTypeOf<Props['selected']>().toEqualTypeOf<string[]>();
  });

  it('enforces onToggle callback parameter as string', () => {
    type Props = React.ComponentProps<typeof TechnologyGraph>;

    expectTypeOf<Props['onToggle']>().parameters.toEqualTypeOf<[string]>();
  });

  it('enforces onToggle callback return type as void', () => {
    type Props = React.ComponentProps<typeof TechnologyGraph>;

    expectTypeOf<Props['onToggle']>().returns.toEqualTypeOf<void>();
  });

  it('supports empty selected arrays', () => {
    const props: React.ComponentProps<typeof TechnologyGraph> = {
      selected: [],
      onToggle: () => {},
    };

    expectTypeOf(props.selected).toEqualTypeOf<string[]>();
  });

  it('returns a valid React element with valid props', () => {
    const element = (
      <TechnologyGraph selected={['react', 'nextjs', 'tailwindcss']} onToggle={() => {}} />
    );

    expectTypeOf(element).toMatchTypeOf<React.ReactElement>();
  });
});
