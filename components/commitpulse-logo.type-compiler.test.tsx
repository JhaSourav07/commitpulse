import { describe, expectTypeOf, it } from 'vitest';
import { CommitPulseLogo } from './commitpulse-logo';

type CommitPulseLogoProps = React.ComponentProps<typeof CommitPulseLogo>;

describe('CommitPulseLogo Type Compiler Validation', () => {
  it('maintains expected props structure', () => {
    expectTypeOf<CommitPulseLogoProps>().toEqualTypeOf<{
      className?: string;
    }>();
  });
  it('accepts optional values without compile errors', () => {
    const props: CommitPulseLogoProps = {};
    expectTypeOf(props).toEqualTypeOf<{
      className?: string;
    }>();
  });
  it('accepts string className values', () => {
    const props: CommitPulseLogoProps = {
      className: 'custom-class',
    };

    expectTypeOf(props.className).toEqualTypeOf<string | undefined>();
  });
  it('rejects invalid prop parameter types', () => {
    const invalid: CommitPulseLogoProps = {
      // @ts-expect-error className must be string
      className: 100,
    };

    void invalid;
  });
  it('enforces strict property configuration', () => {
    expectTypeOf<CommitPulseLogoProps>().toMatchObjectType<{
      className?: string;
    }>();
  });
});
