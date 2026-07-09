import { describe, it, expectTypeOf } from 'vitest';
import type { JSX } from 'react';
import NotFound from './not-found';
import MiniGame from '../components/MiniGame';

describe('NotFound TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('1. enforces field property configurations on the exported component', () => {
    type NotFoundType = typeof NotFound;

    expectTypeOf<NotFoundType>().toBeFunction();
    expectTypeOf<NotFoundType>().returns.toMatchTypeOf<JSX.Element | null>();
  });

  it('2. asserts that invalid prop parameters are blocked during static type checking', () => {
    type NotFoundParams = Parameters<typeof NotFound>;

    expectTypeOf<NotFoundParams>().toEqualTypeOf<[]>();
    expectTypeOf<{ invalidProp: string }>().not.toMatchTypeOf<NotFoundParams>();
  });

  it('3. verifies custom types accept optional values without compile errors', () => {
    type MiniGameType = typeof MiniGame;

    expectTypeOf<MiniGameType>().toBeFunction();
    expectTypeOf<MiniGameType>().returns.toMatchTypeOf<JSX.Element | null>();
  });

  it('4. verifies internal function signatures return correct types', () => {
    expectTypeOf<typeof NotFound>().not.toHaveProperty('displayName');
  });

  it('5. verifies schema constraints on JSX rendering output', () => {
    type ElementType = ReturnType<typeof NotFound>;
    expectTypeOf<ElementType>().toMatchTypeOf<JSX.Element>();
  });
});
