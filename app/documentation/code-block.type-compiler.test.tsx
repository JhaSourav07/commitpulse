import { describe, expectTypeOf, it } from 'vitest';
import React from 'react';
import { CodeBlock } from './code-block';

type CodeBlockProps = React.ComponentProps<typeof CodeBlock>;

describe('CodeBlock Type Compiler Validation', () => {
  it('maintains expected props structure', () => {
    expectTypeOf<CodeBlockProps>().toEqualTypeOf<{
      code: string;
    }>();
  });

  it('accepts valid prop values', () => {
    const props: CodeBlockProps = {
      code: 'console.log("Hello");',
    };

    expectTypeOf(props).toEqualTypeOf<CodeBlockProps>();
  });

  it('rejects invalid code prop type', () => {
    const invalid: CodeBlockProps = {
      // @ts-expect-error code must be a string
      code: 123,
    };

    void invalid;
  });

  it('returns a valid React element', () => {
    const element = <CodeBlock code="const a = 1;" />;

    expectTypeOf(element).toMatchTypeOf<React.ReactElement>();
  });

  it('enforces strict property configuration', () => {
    expectTypeOf<keyof CodeBlockProps>().toEqualTypeOf<'code'>();
  });
});
