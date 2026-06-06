import { describe, it, expectTypeOf } from 'vitest';
import type React from 'react';
import type { ActivityData } from '@/types/dashboard';
import ActivityLandscape, { getFilteredData } from './ActivityLandscape';

type ActivityLandscapeProps = React.ComponentProps<typeof ActivityLandscape>;

describe('ActivityLandscape Type Compiler Validation', () => {
  it('requires data prop as ActivityData array', () => {
    expectTypeOf<ActivityLandscapeProps['data']>().toEqualTypeOf<ActivityData[]>();
  });

  it('enforces required fields on ActivityData interface', () => {
    expectTypeOf<ActivityData>().toMatchTypeOf<{
      date: string;
      count: number;
      intensity: 0 | 1 | 2 | 3 | 4;
    }>();
  });

  it('allows optional locAdditions and locDeletions on ActivityData', () => {
    expectTypeOf<ActivityData['locAdditions']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<ActivityData['locDeletions']>().toEqualTypeOf<number | undefined>();
  });

  it('getFilteredData returns ActivityData array', () => {
    expectTypeOf<ReturnType<typeof getFilteredData>>().toEqualTypeOf<ActivityData[]>();
  });

  it('exports ActivityLandscape as a React component type', () => {
    expectTypeOf(ActivityLandscape).toMatchTypeOf<React.ComponentType<ActivityLandscapeProps>>();
  });
});
