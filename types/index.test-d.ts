import { describe, expectTypeOf, it } from 'vitest';
import type {
  StreakStats,
  BadgeTheme,
  ContributionDay,
  BadgeParams,
  NotificationPreferences,
  HexColor,
  SpeedString,
  NotificationFrequency,
} from './index';

describe('Type Safety Assertions for types/index.ts', () => {
  it('Test 1: StreakStats should strictly require number and string types', () => {
    // Asserts that core streak logic cannot accidentally be converted to strings
    expectTypeOf<StreakStats>().toHaveProperty('currentStreak').toBeNumber();
    expectTypeOf<StreakStats>().toHaveProperty('longestStreak').toBeNumber();
    expectTypeOf<StreakStats>().toHaveProperty('totalContributions').toBeNumber();
    expectTypeOf<StreakStats>().toHaveProperty('todayDate').toBeString();
  });

  it('Test 2: BadgeTheme should enforce HexColor branding on core properties', () => {
    // Asserts that standard strings cannot be passed where branded HexColors are required
    expectTypeOf<BadgeTheme>().toHaveProperty('bg').toEqualTypeOf<HexColor>();
    expectTypeOf<BadgeTheme>().toHaveProperty('text').toEqualTypeOf<HexColor>();
    expectTypeOf<BadgeTheme>().toHaveProperty('accent').toEqualTypeOf<HexColor>();
    // Asserts that the negative state color is optional
    expectTypeOf<BadgeTheme>().toHaveProperty('negative').toEqualTypeOf<HexColor | undefined>();
  });

  it('Test 3: ContributionDay should correctly type LoC properties as optional', () => {
    // Asserts base properties
    expectTypeOf<ContributionDay>().toHaveProperty('contributionCount').toBeNumber();
    expectTypeOf<ContributionDay>().toHaveProperty('date').toBeString();
    // Asserts that Lines of Code (LoC) properties do not break the API if omitted
    expectTypeOf<ContributionDay>()
      .toHaveProperty('locAdditions')
      .toEqualTypeOf<number | undefined>();
    expectTypeOf<ContributionDay>()
      .toHaveProperty('locDeletions')
      .toEqualTypeOf<number | undefined>();
  });

  it('Test 4: BadgeParams should enforce strict literal unions on configuration flags', () => {
    expectTypeOf<BadgeParams>().toHaveProperty('user').toBeString();
    // Asserts that speed requires a specific template literal format (e.g., '4s')
    expectTypeOf<BadgeParams>().toHaveProperty('speed').toEqualTypeOf<SpeedString>();
    // Asserts that animations are restricted to exact string literals or undefined
    expectTypeOf<BadgeParams>()
      .toHaveProperty('entrance')
      .toEqualTypeOf<'rise' | 'fade' | 'slide' | 'wave' | 'bounce' | 'none' | undefined>();
  });

  it('Test 5: NotificationPreferences should enforce exact literal types for frequency', () => {
    expectTypeOf<NotificationPreferences>().toHaveProperty('enabled').toBeBoolean();
    expectTypeOf<NotificationPreferences>().toHaveProperty('email').toBeString();
    // Asserts that frequency is tightly bound to the NotificationFrequency type
    expectTypeOf<NotificationPreferences>()
      .toHaveProperty('frequency')
      .toEqualTypeOf<NotificationFrequency>();
  });
});
