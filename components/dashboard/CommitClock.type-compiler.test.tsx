import { type ComponentProps } from 'react';
import { describe, expectTypeOf, it } from 'vitest';
import type { CommitClockData } from '@/types/dashboard';
import CommitClock, { findPeakIndex } from './CommitClock';

type CommitClockProps = ComponentProps<typeof CommitClock>;

describe('CommitClock — TypeScript compiler validation', () => {
  it('data prop is typed as CommitClockData[]', () => {
    expectTypeOf<CommitClockProps['data']>().toEqualTypeOf<CommitClockData[]>();
  });

  it('CommitClockData.day field is typed as string', () => {
    expectTypeOf<CommitClockData['day']>().toEqualTypeOf<string>();
  });

  it('CommitClockData.commits field is typed as number', () => {
    expectTypeOf<CommitClockData['commits']>().toEqualTypeOf<number>();
  });

  it('findPeakIndex parameter is typed as CommitClockData[] and return type is number', () => {
    expectTypeOf<Parameters<typeof findPeakIndex>[0]>().toEqualTypeOf<CommitClockData[]>();
    expectTypeOf<ReturnType<typeof findPeakIndex>>().toEqualTypeOf<number>();
  });

  it('CommitClock is exported as a callable React component function', () => {
    expectTypeOf(CommitClock).toBeFunction();
  });
});
