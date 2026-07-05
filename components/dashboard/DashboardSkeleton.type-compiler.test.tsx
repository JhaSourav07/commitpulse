import { describe, expectTypeOf, it } from 'vitest';
import DashboardSkeleton from './DashboardSkeleton';

type DashboardSkeletonProps = React.ComponentProps<typeof DashboardSkeleton>;

describe('DashboardSkeleton Type Compiler Validation', () => {
  it('exports DashboardSkeleton as a callable React component', () => {
    expectTypeOf(DashboardSkeleton).toBeFunction();
  });

  it('accepts component props', () => {
    const props: DashboardSkeletonProps = {};

    expectTypeOf(props).toMatchTypeOf<DashboardSkeletonProps>();
  });

  it('preserves component prop schema', () => {
    expectTypeOf<DashboardSkeletonProps>().toMatchTypeOf<
      React.ComponentProps<typeof DashboardSkeleton>
    >();
  });

  it('supports compile-time validation for component props', () => {
    const props: DashboardSkeletonProps = {};

    expectTypeOf(props).toMatchTypeOf<DashboardSkeletonProps>();
  });

  it('accepts an empty props object', () => {
    const props: DashboardSkeletonProps = {};
    expectTypeOf(props).toMatchTypeOf<DashboardSkeletonProps>();
  });
});
