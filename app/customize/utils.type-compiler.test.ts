import { describe, it, expect, expectTypeOf } from 'vitest';

import type { ExportFormat, CustomizeOptions } from './types';
import { buildQueryParams } from './utils';
describe('Utils Type Compiler Validation', () => {
  it('should verify ExportFormat supports only valid export formats', () => {
    expectTypeOf<ExportFormat>().toEqualTypeOf<'markdown' | 'html' | 'action' | 'tsx'>();
  });
});
it('should enforce CustomizeOptions field types correctly', () => {
  expectTypeOf<CustomizeOptions['username']>().toEqualTypeOf<string>();

  expectTypeOf<CustomizeOptions['badgeWidth']>().toEqualTypeOf<number | ''>();

  expectTypeOf<CustomizeOptions['badgeHeight']>().toEqualTypeOf<number | ''>();

  expectTypeOf<CustomizeOptions['grace']>().toEqualTypeOf<number>();
});

it('should block invalid properties during static type checking', () => {
  expectTypeOf<CustomizeOptions>().not.toMatchTypeOf<{
    invalidProp: string;
  }>();
});

it('should allow valid union type values without compile errors', () => {
  expectTypeOf<CustomizeOptions['badgeWidth']>().toEqualTypeOf<number | ''>();

  expectTypeOf<CustomizeOptions['badgeHeight']>().toEqualTypeOf<number | ''>();

  expectTypeOf<CustomizeOptions['timezone']>().toEqualTypeOf<
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

it('should build query parameters correctly for valid customization options', () => {
  const options: CustomizeOptions = {
    username: 'veeresh4520',
    theme: 'dark',
    bgHex: 'ffffff',
    bgType: 'solid',
    bgStart: '',
    bgEnd: '',
    bgAngle: 90,
    accentHex: '000000',
    textHex: '111111',
    scale: 'linear',
    speed: '8s',
    font: 'Inter',
    year: '',
    radius: 8,
    size: 'medium',
    hideTitle: false,
    hideBackground: false,
    hideStats: false,
    viewMode: 'default',
    deltaFormat: 'percent',
    badgeWidth: '',
    badgeHeight: '',
    grace: 1,
    language: 'en',
    timezone: 'UTC',
  };

  const query = buildQueryParams(options);

  expect(query).toContain('user=veeresh4520');
  expect(query).toContain('bg=ffffff');
  expect(query).toContain('accent=000000');
  expect(query).toContain('text=111111');
});
