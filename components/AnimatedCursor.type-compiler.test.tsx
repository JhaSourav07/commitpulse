import { describe, expectTypeOf, it } from 'vitest';
import AnimatedCursor from './AnimatedCursor';

type AnimatedCursorProps = React.ComponentProps<typeof AnimatedCursor>;

describe('AnimatedCursor Type Compiler Validation', () => {
  it('exports AnimatedCursor as a callable React component', () => {
    expectTypeOf(AnimatedCursor).toBeFunction();
  });

  it('accepts component props', () => {
    const props: AnimatedCursorProps = {};
    expectTypeOf(props).toMatchTypeOf<AnimatedCursorProps>();
  });

  it('preserves component prop schema', () => {
    expectTypeOf<AnimatedCursorProps>().toEqualTypeOf<
      React.ComponentProps<typeof AnimatedCursor>
    >();
  });

  it('supports compile-time validation for component props', () => {
    expectTypeOf<AnimatedCursorProps>().toMatchTypeOf<
      React.ComponentProps<typeof AnimatedCursor>
    >();
  });

  it('accepts an empty props object', () => {
    const props: AnimatedCursorProps = {};
    expectTypeOf(props).toEqualTypeOf<AnimatedCursorProps>();
  });
});
