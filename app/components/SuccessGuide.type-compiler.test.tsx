import { describe, expectTypeOf, it } from 'vitest';
import React from 'react';
import { SuccessGuide } from './SuccessGuide';

type SuccessGuideProps = React.ComponentProps<typeof SuccessGuide>;

describe('SuccessGuide Type Compiler Validation', () => {
  it('maintains expected props structure', () => {
    expectTypeOf<SuccessGuideProps>().toEqualTypeOf<{
      markdown: string;
      onDismiss: () => void;
    }>();
  });
  it('accepts valid prop values', () => {
    const props: SuccessGuideProps = {
      markdown: '# Hello',
      onDismiss: () => {},
    };

    expectTypeOf(props).toEqualTypeOf<SuccessGuideProps>();
  });
  it('rejects invalid markdown type', () => {
    const invalid: SuccessGuideProps = {
      // @ts-expect-error markdown must be string
      markdown: 123,
      onDismiss: () => {},
    };

    void invalid;
  });
  it('rejects invalid onDismiss type', () => {
    const invalid: SuccessGuideProps = {
      markdown: '# Hello',
      // @ts-expect-error onDismiss must be function
      onDismiss: 'close',
    };

    void invalid;
  });
  it('enforces strict property configuration', () => {
    expectTypeOf<keyof SuccessGuideProps>().toEqualTypeOf<'markdown' | 'onDismiss'>();
  });
});
