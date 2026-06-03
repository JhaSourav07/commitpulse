import { describe, expectTypeOf, it } from 'vitest';
import {
  CONTRIBUTION_MILESTONES,
  FONT_MAP,
  GHOST_HEIGHT_PX,
  LINEAR_SCALE_MULTIPLIER,
  LOG_SCALE_MULTIPLIER,
  MAX_LINEAR_HEIGHT,
  MAX_LOG_HEIGHT,
  SVG_HEIGHT,
  SVG_WIDTH,
} from './constants';

describe('lib/svg/constants — TypeScript type compiler', () => {
  it('numeric dimension constants are typed as number', () => {
    expectTypeOf(SVG_WIDTH).toBeNumber();
    expectTypeOf(SVG_HEIGHT).toBeNumber();
    expectTypeOf(GHOST_HEIGHT_PX).toBeNumber();
    expectTypeOf(MAX_LOG_HEIGHT).toBeNumber();
    expectTypeOf(MAX_LINEAR_HEIGHT).toBeNumber();
  });

  it('scale multiplier constants are typed as number', () => {
    expectTypeOf(LOG_SCALE_MULTIPLIER).toBeNumber();
    expectTypeOf(LINEAR_SCALE_MULTIPLIER).toBeNumber();
  });

  it('FONT_MAP satisfies Record<string, string> — keys and values are both strings', () => {
    expectTypeOf(FONT_MAP).toEqualTypeOf<Record<string, string>>();
    expectTypeOf(FONT_MAP).not.toEqualTypeOf<Record<string, number>>();
  });

  it('CONTRIBUTION_MILESTONES satisfies a readonly number array and its elements are numbers', () => {
    expectTypeOf(CONTRIBUTION_MILESTONES).toEqualTypeOf<number[]>();
    expectTypeOf(CONTRIBUTION_MILESTONES).items.toBeNumber();
  });

  it('a function accepting number accepts all numeric constants without type errors', () => {
    const requiresNumber = (n: number): number => n;

    expectTypeOf(requiresNumber).parameter(0).toBeNumber();
    // Verify each constant satisfies the number parameter type
    expectTypeOf(SVG_WIDTH).toEqualTypeOf<Parameters<typeof requiresNumber>[0]>();
    expectTypeOf(SVG_HEIGHT).toEqualTypeOf<Parameters<typeof requiresNumber>[0]>();
    expectTypeOf(LOG_SCALE_MULTIPLIER).toEqualTypeOf<Parameters<typeof requiresNumber>[0]>();
    expectTypeOf(LINEAR_SCALE_MULTIPLIER).toEqualTypeOf<Parameters<typeof requiresNumber>[0]>();
  });
});
