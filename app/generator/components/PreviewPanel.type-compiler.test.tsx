import { describe, it, expectTypeOf, expect } from 'vitest';
import React from 'react';
import { PreviewPanel } from './PreviewPanel';

describe('PreviewPanel Type Compiler Validation', () => {
  it('exports PreviewPanel as a callable React component', () => {
    expectTypeOf<typeof PreviewPanel>().toBeFunction();
  });

  it('accepts component props', () => {
    type Props = React.ComponentProps<typeof PreviewPanel>;

    expectTypeOf<Props>().toMatchObjectType<{
      markdown: string;
      hasContent?: boolean;
    }>();
  });

  it('preserves component prop schema', () => {
    type Props = React.ComponentProps<typeof PreviewPanel>;

    expectTypeOf<Props['markdown']>().toEqualTypeOf<string>();
  });

  it('supports compile-time validation for component props', () => {
    const validProps: React.ComponentProps<typeof PreviewPanel> = {
      markdown: '# Hello World',
    };

    expect(validProps.markdown).toBe('# Hello World');

    const invalidProps: React.ComponentProps<typeof PreviewPanel> = {
      // @ts-expect-error - markdown must be a string
      markdown: 123,
    };

    expect(invalidProps).toBeDefined();

    expect(invalidProps).toBeDefined();
  });

  it('accepts a valid props object', () => {
    const props: React.ComponentProps<typeof PreviewPanel> = {
      markdown: 'Sample markdown',
    };

    expect(props.markdown).toBe('Sample markdown');
  });
});
