import { describe, expectTypeOf, it } from 'vitest';
import type { ActivityData } from '@/types/dashboard';
import Heatmap from './Heatmap';

type HeatmapProps = React.ComponentProps<typeof Heatmap>;

describe('Heatmap Type Compiler Validation', () => {
  it('requires data prop with ActivityData array type', () => {
    expectTypeOf<HeatmapProps['data']>().toEqualTypeOf<ActivityData[]>();
  });

  it('supports optional title prop', () => {
    expectTypeOf<HeatmapProps['title']>().toEqualTypeOf<string | undefined>();
  });

  it('supports optional subtitle prop', () => {
    expectTypeOf<HeatmapProps['subtitle']>().toEqualTypeOf<string | undefined>();
  });

  it('supports optional emptyMessage prop', () => {
    expectTypeOf<HeatmapProps['emptyMessage']>().toEqualTypeOf<string | undefined>();
  });

  it('exports Heatmap as a callable React component', () => {
    expectTypeOf(Heatmap).toBeFunction();
  });
});
