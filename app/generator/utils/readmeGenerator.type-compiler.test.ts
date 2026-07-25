import { describe, expectTypeOf, it } from 'vitest';
import { generateReadme, getEmptyReadme } from './readmeGenerator';
import type { GeneratorState } from '../types';
import { SupportedLanguage } from '@/lib/i18n/languages';

describe('readmeGenerator Type Compiler Validation', () => {
  it('generateReadme is a function', () => {
    expectTypeOf(generateReadme).toBeFunction();
  });

  it('generateReadme returns a string', () => {
    expectTypeOf(generateReadme).returns.toBeString();
  });

  it('getEmptyReadme is a function', () => {
    expectTypeOf(getEmptyReadme).toBeFunction();
  });

  it('getEmptyReadme returns a string', () => {
    expectTypeOf(getEmptyReadme).returns.toBeString();
  });

  it('generateReadme accepts a GeneratorState as first parameter', () => {
    expectTypeOf(generateReadme).parameter(0).toMatchTypeOf<GeneratorState>();
  });

  it('generateReadme accepts an optional language parameter as second argument', () => {
    expectTypeOf(generateReadme).parameter(1).toMatchTypeOf<SupportedLanguage | undefined>();
  });

  it('generateReadme can be called with both parameters', () => {
    const mockState = {} as GeneratorState;
    expectTypeOf(generateReadme).toBeCallableWith(mockState, 'en');
  });
});
