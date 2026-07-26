import { describe, expectTypeOf, it } from 'vitest';
import type { ActivityData } from '@/types/dashboard';

describe('tooltipUtils type compiler tests', () => {
  it('validates ActivityData structure correctly', () => {
    const validData: ActivityData = {
      date: '2024-01-01',
      count: 5,
      intensity: 2,
    };

    expectTypeOf(validData.date).toBeString();
    expectTypeOf(validData.count).toBeNumber();
    expectTypeOf(validData.intensity).toBeNumber();
  });

  it('ensures ActivityData array typing works', () => {
    const data: ActivityData[] = [
      {
        date: '2024-01-01',
        count: 1,
        intensity: 1,
      },
    ];

    expectTypeOf(data).toBeArray();
  });

  it('accepts optional compatible values safely', () => {
    const data: ActivityData = {
      date: '2024-01-02',
      count: 0,
      intensity: 0,
    };

    expectTypeOf(data.count).toEqualTypeOf<number>();
  });
  it('rejects invalid property types during compilation', () => {
    expectTypeOf<ActivityData>().toBeObject();
  });

  it('rejects missing required properties', () => {
    expectTypeOf<ActivityData>().toBeObject();
  });
});
