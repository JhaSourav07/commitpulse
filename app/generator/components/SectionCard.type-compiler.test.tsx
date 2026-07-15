import { describe, it, expectTypeOf } from 'vitest';
import React from 'react';
import { SectionCard } from './SectionCard';

type SectionCardProps = React.ComponentProps<typeof SectionCard>;

describe('SectionCard Type Compiler Validation', () => {
  it('exports SectionCard as a callable React component', () => {
    expectTypeOf(SectionCard).toBeFunction();
  });

  it('accepts component props', () => {
    const props: SectionCardProps = {
      title: 'Settings',
      children: <div>Content</div>,
    };

    expectTypeOf(props).toEqualTypeOf<SectionCardProps>();
  });

  it('preserves component prop schema', () => {
    expectTypeOf<SectionCardProps>().toEqualTypeOf<{
      title: string;
      icon?: string;
      description?: string;
      children: React.ReactNode;
      defaultOpen?: boolean;
      badge?: number;
    }>();
  });

  it('supports compile-time validation for component props', () => {
    expectTypeOf<SectionCardProps>().toBeObject();
  });

  it('accepts a valid props object', () => {
    const props: SectionCardProps = {
      title: 'Generator',
      children: <div />,
      icon: '⚙️',
      description: 'Example',
      defaultOpen: true,
      badge: 2,
    };

    expectTypeOf(props).toEqualTypeOf<SectionCardProps>();
  });
});
