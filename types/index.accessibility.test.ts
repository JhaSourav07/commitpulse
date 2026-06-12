import { describe, it, expectTypeOf } from 'vitest';
import type { BadgeSize, Scale, NotificationFrequency, BadgeParams, HexColor } from './index';

describe('Types Integrity & Validation Tests', () => {
  it('1. correctly restricts Scale to specific valid literals', () => {
    expectTypeOf<Scale>().toEqualTypeOf<'linear' | 'log'>();
    expectTypeOf<'invalid'>().not.toMatchTypeOf<Scale>();
  });

  it('2. properly enforces NotificationFrequency literal unions', () => {
    expectTypeOf<NotificationFrequency>().toEqualTypeOf<'realtime' | 'daily' | 'weekly'>();
    expectTypeOf<'monthly'>().not.toMatchTypeOf<NotificationFrequency>();
  });

  it('3. validates BadgeSize string unions', () => {
    expectTypeOf<BadgeSize>().toEqualTypeOf<'small' | 'medium' | 'large'>();
    expectTypeOf<'xl'>().not.toMatchTypeOf<BadgeSize>();
  });

  it('4. ensures BadgeParams defines strict types for core properties', () => {
    // Instead of creating partial objects, we directly inspect the type signatures
    expectTypeOf<BadgeParams['user']>().toBeString();
    expectTypeOf<BadgeParams['scale']>().toEqualTypeOf<Scale>();
    expectTypeOf<BadgeParams['bg']>().toEqualTypeOf<HexColor>();
  });

  it('5. confirms HexColor utilizes branding to prevent arbitrary string assignment', () => {
    // Standard unbranded strings should not perfectly match the branded HexColor type
    expectTypeOf<string>().not.toEqualTypeOf<HexColor>();
  });
});
