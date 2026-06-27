import { describe, it, expectTypeOf } from 'vitest';
import React, { ComponentProps } from 'react';
import DashboardClient, { ProfileMetrics, CoderProfile } from './DashboardClient';
import type { DashboardPeriod } from '@/utils/dashboardPeriod';

describe('DashboardClient - TypeScript Compiler Validation & Schema Constraints Stability (Variation 10)', () => {
  it('Import the interfaces, types, or validation schemas associated with the file: Verify exported types', () => {
    // Asserting the exact shape of exported interfaces
    expectTypeOf<ProfileMetrics>().toEqualTypeOf<{
      currentStreak: number;
      commitClock: { day: string; commits: number }[];
    }>();

    expectTypeOf<CoderProfile>().toHaveProperty('peakHourStart').toBeNumber();
    expectTypeOf<CoderProfile>().toHaveProperty('profileName').toBeString();
  });

  it('Use type-testing assertions (expectTypeOf) to enforce field property configurations: Infer unexported props', () => {
    // Extracting the props from the component
    type Props = ComponentProps<typeof DashboardClient>;

    // Assert the required fields
    expectTypeOf<Props>().toHaveProperty('username').toBeString();
    expectTypeOf<Props>().toHaveProperty('period').toEqualTypeOf<DashboardPeriod>();

    // Test the internal initialData structure
    expectTypeOf<Props['initialData']>().toHaveProperty('profile').toBeObject();
    expectTypeOf<Props['initialData']['profile']>().toHaveProperty('username').toBeString();
  });

  it('Assert that invalid prop parameters are blocked during static type checking: Rejects missing props', () => {
    type Props = ComponentProps<typeof DashboardClient>;

    // Missing 'username', 'initialData', 'period'
    expectTypeOf<Record<string, never>>().not.toMatchTypeOf<Props>();

    // 'username' must be a string, not a number
    expectTypeOf<{
      username: number;
      initialData: Props['initialData'];
      period: DashboardPeriod;
    }>().not.toMatchTypeOf<Props>();
  });

  it('Verify custom types accept optional values without compile errors: compareData is optional or nullable', () => {
    type Props = ComponentProps<typeof DashboardClient>;

    // compareData should be optional or accept null/undefined
    expectTypeOf<Props['compareData']>().toBeNullable();
    expectTypeOf<Props>().toHaveProperty('compareData');

    // This should compile fine (compareData omitted)
    const validComponent = (
      <DashboardClient
        username="test"
        initialData={{} as unknown as Props['initialData']}
        period={{} as unknown as DashboardPeriod}
      />
    );
    void validComponent;
  });

  it('Verify schema validation constraints return strict validation reports: CoderProfile strict unions', () => {
    // profileName has a specific union of strings
    expectTypeOf<CoderProfile['profileName']>().toEqualTypeOf<
      'Early Builder ☀' | 'Weekend Warrior 🚀' | 'Consistent Runner 🏃‍♂️'
    >();

    // intensity in activity array has strict union 0 | 1 | 2 | 3 | 4
    type Props = ComponentProps<typeof DashboardClient>;
    type ActivityIntensity = Props['initialData']['activity'][0]['intensity'];
    expectTypeOf<ActivityIntensity>().toEqualTypeOf<0 | 1 | 2 | 3 | 4>();
  });
});
