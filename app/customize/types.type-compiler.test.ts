import { describe, it, expectTypeOf } from 'vitest';
import type {
  BadgeSize,
  CustomizeOptions,
  DeltaFormat,
  ExportFormat,
  Font,
  Language,
  Scale,
  ThemeOption,
  Timezone,
  ViewMode,
} from './types';

describe('types - compiler validation', () => {
  it('accepts valid literal types', () => {
    expectTypeOf<Scale>().toMatchTypeOf<'linear' | 'log' | 'sqrt'>();
    expectTypeOf<ExportFormat>().toMatchTypeOf<'markdown' | 'html' | 'action' | 'tsx'>();
    expectTypeOf<BadgeSize>().toMatchTypeOf<'small' | 'medium' | 'large'>();
  });

  it('validates CustomizeOptions structure', () => {
    expectTypeOf<CustomizeOptions>().toHaveProperty('username');
    expectTypeOf<CustomizeOptions>().toHaveProperty('theme');
    expectTypeOf<CustomizeOptions>().toHaveProperty('scale');
    expectTypeOf<CustomizeOptions>().toHaveProperty('viewMode');
    expectTypeOf<CustomizeOptions>().toHaveProperty('timezone');
  });

  it('accepts supported string-based option types', () => {
    expectTypeOf<Font>().toMatchTypeOf<string>();
    expectTypeOf<ThemeOption>().toMatchTypeOf<string>();
  });

  it('validates constrained union types', () => {
    expectTypeOf<ViewMode>().toMatchTypeOf<
      'default' | 'monthly' | 'pulse' | 'skyline' | 'languages'
    >();

    expectTypeOf<DeltaFormat>().toMatchTypeOf<'percent' | 'absolute' | 'both'>();

    expectTypeOf<Language>().toMatchTypeOf<'en' | 'es' | 'hi' | 'pt' | 'ko' | 'fr' | 'ja' | 'de'>();

    expectTypeOf<Timezone>().toMatchTypeOf<
      | 'UTC'
      | 'America/New_York'
      | 'America/Los_Angeles'
      | 'Europe/London'
      | 'Europe/Berlin'
      | 'Asia/Kolkata'
      | 'Asia/Tokyo'
      | 'Australia/Sydney'
    >();
  });

  it('supports numeric and empty-string badge dimensions', () => {
    expectTypeOf<CustomizeOptions['badgeWidth']>().toEqualTypeOf<number | ''>();
    expectTypeOf<CustomizeOptions['badgeHeight']>().toEqualTypeOf<number | ''>();
  });
});
