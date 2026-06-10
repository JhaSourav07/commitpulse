import { describe, expectTypeOf, it } from 'vitest';
import { CopyIcon, ZapIcon, BoxIcon, CheckIcon, CloseIcon } from './Icons';

describe('Icons Type Compiler Validation', () => {
  it('exports icon components as functions', () => {
    expectTypeOf(CopyIcon).toBeFunction();
    expectTypeOf(ZapIcon).toBeFunction();
    expectTypeOf(BoxIcon).toBeFunction();
    expectTypeOf(CheckIcon).toBeFunction();
    expectTypeOf(CloseIcon).toBeFunction();
  });

  it('accepts no parameters for icon components', () => {
    expectTypeOf(CopyIcon).parameters.toEqualTypeOf<[]>();
    expectTypeOf(ZapIcon).parameters.toEqualTypeOf<[]>();
    expectTypeOf(BoxIcon).parameters.toEqualTypeOf<[]>();
    expectTypeOf(CheckIcon).parameters.toEqualTypeOf<[]>();
    expectTypeOf(CloseIcon).parameters.toEqualTypeOf<[]>();
  });

  it('all icon components return compatible types', () => {
    expectTypeOf<ReturnType<typeof CopyIcon>>().toEqualTypeOf<ReturnType<typeof ZapIcon>>();

    expectTypeOf<ReturnType<typeof ZapIcon>>().toEqualTypeOf<ReturnType<typeof BoxIcon>>();

    expectTypeOf<ReturnType<typeof BoxIcon>>().toEqualTypeOf<ReturnType<typeof CheckIcon>>();

    expectTypeOf<ReturnType<typeof CheckIcon>>().toEqualTypeOf<ReturnType<typeof CloseIcon>>();
  });

  it('maintains compatible return types across icons', () => {
    expectTypeOf<ReturnType<typeof CopyIcon>>().toEqualTypeOf<ReturnType<typeof ZapIcon>>();

    expectTypeOf<ReturnType<typeof BoxIcon>>().toEqualTypeOf<ReturnType<typeof CheckIcon>>();

    expectTypeOf<ReturnType<typeof CheckIcon>>().toEqualTypeOf<ReturnType<typeof CloseIcon>>();
  });

  it('all icon components share the same callable signature', () => {
    expectTypeOf(CopyIcon).toEqualTypeOf<typeof ZapIcon>();
    expectTypeOf(ZapIcon).toEqualTypeOf<typeof BoxIcon>();
    expectTypeOf(BoxIcon).toEqualTypeOf<typeof CheckIcon>();
    expectTypeOf(CheckIcon).toEqualTypeOf<typeof CloseIcon>();
  });
});
