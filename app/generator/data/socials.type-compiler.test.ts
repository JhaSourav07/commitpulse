import { describe, it, expectTypeOf } from 'vitest';
import { SOCIALS, SOCIAL_CATEGORIES, getSocialById } from './socials';
import type { Social, SocialCategory } from '../types';

describe('Socials Type Compiler Validation', () => {
  it('has correct types for exported collections', () => {
    expectTypeOf(SOCIALS).toEqualTypeOf<Social[]>();
    expectTypeOf(SOCIAL_CATEGORIES).toEqualTypeOf<SocialCategory[]>();
  });
  it('enforces Social interface field types', () => {
    expectTypeOf<Social['id']>().toBeString();
    expectTypeOf<Social['name']>().toBeString();
    expectTypeOf<Social['category']>().toEqualTypeOf<SocialCategory>();
    expectTypeOf<Social['iconUrl']>().toBeString();
    expectTypeOf<Social['type']>().toEqualTypeOf<'simpleicon' | 'devicon'>();
    expectTypeOf<Social['baseUrl']>().toBeString();
    expectTypeOf<Social['placeholder']>().toBeString();
  });
  it('rejects invalid Social objects at compile time', () => {
    const invalid: Social = {
      //@ts-expect-error - id must be a string
      id: 123,
      name: 'GitHub',
      category: 'Developer',
      iconUrl: '',
      type: 'devicon',
      baseUrl: '',
      placeholder: '',
    };
    void invalid;
  });
  it('accepts optional siSlug property', () => {
    const socialWithOptional: Social = {
      id: 'github',
      name: 'GitHub',
      category: 'Developer',
      iconUrl: '',
      type: 'devicon',
      baseUrl: '',
      placeholder: '',
    };
    expectTypeOf(socialWithOptional).toMatchTypeOf<Social>();
  });
  it('returns a Social or undefined from getSocialById', () => {
    expectTypeOf(getSocialById).returns.toEqualTypeOf<Social | undefined>();
  });
});
