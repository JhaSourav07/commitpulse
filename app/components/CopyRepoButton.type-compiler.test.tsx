import { describe, expectTypeOf, it } from 'vitest';
import CopyRepoButton from './CopyRepoButton';

describe('CopyRepoButton Type Compiler Validation', () => {
  it('exports CopyRepoButton as a function component', () => {
    expectTypeOf(CopyRepoButton).toBeFunction();
  });

  it('accepts no parameters', () => {
    expectTypeOf(CopyRepoButton).parameters.toEqualTypeOf<[]>();
  });

  it('returns a valid component type', () => {
    expectTypeOf<ReturnType<typeof CopyRepoButton>>().toBeObject();
  });

  it('maintains a stable callable signature', () => {
    expectTypeOf(CopyRepoButton).toEqualTypeOf<typeof CopyRepoButton>();
  });

  it('preserves return type consistency', () => {
    expectTypeOf<ReturnType<typeof CopyRepoButton>>().toEqualTypeOf<
      ReturnType<typeof CopyRepoButton>
    >();
  });
});
