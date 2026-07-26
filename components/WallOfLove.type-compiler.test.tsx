import { describe, it, expectTypeOf } from 'vitest';
import type { Testimonial } from './WallOfLove';

describe('WallOfLove type compiler validation', () => {
  it('matches the expected testimonial structure', () => {
    expectTypeOf<Testimonial>().toMatchObjectType<{
      name: string;
      handle: string;
      avatar: string;
      message: string;
      platform: 'twitter' | 'github';
      accentColor: string;
    }>();
  });

  it('enforces string field types', () => {
    expectTypeOf<Testimonial['name']>().toEqualTypeOf<string>();
    expectTypeOf<Testimonial['message']>().toEqualTypeOf<string>();
  });

  it('restricts platform values', () => {
    expectTypeOf<Testimonial['platform']>().toEqualTypeOf<'twitter' | 'github'>();
  });

  it('accepts valid testimonial objects', () => {
    const testimonial: Testimonial = {
      name: 'Test User',
      handle: '@test',
      avatar: 'avatar.png',
      message: 'Hello',
      platform: 'twitter',
      accentColor: '#10b981',
    };

    expectTypeOf(testimonial).toEqualTypeOf<Testimonial>();
  });

  it('keeps accentColor typed as string', () => {
    expectTypeOf<Testimonial['accentColor']>().toEqualTypeOf<string>();
  });
});
