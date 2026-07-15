import { describe, it, expectTypeOf } from 'vitest';
import type { FooterLink, SocialLink } from './Footer';

describe('Footer Type Compiler Validation', () => {
  it('enforces required and optional fields on FooterLink', () => {
    expectTypeOf<FooterLink>().toHaveProperty('label').toEqualTypeOf<string>();
    expectTypeOf<FooterLink>().toHaveProperty('href').toEqualTypeOf<string>();
    expectTypeOf<FooterLink>().toHaveProperty('isExternal').toEqualTypeOf<boolean | undefined>();
  });

  it('enforces all required fields on SocialLink (no optional properties)', () => {
    expectTypeOf<SocialLink>().toHaveProperty('label').toEqualTypeOf<string>();
    expectTypeOf<SocialLink>().toHaveProperty('href').toEqualTypeOf<string>();
    expectTypeOf<SocialLink>().toHaveProperty('ariaLabel').toEqualTypeOf<string>();
    expectTypeOf<SocialLink>().toHaveProperty('icon').toEqualTypeOf<string>();
  });

  it('rejects invalid FooterLink objects missing required fields at compile time', () => {
    // @ts-expect-error - missing required `href`
    const invalid: FooterLink = { label: 'Home' };
    void invalid;
  });

  it('rejects FooterLink objects with wrong field types at compile time', () => {
    // @ts-expect-error - isExternal must be boolean, not string
    const invalid: FooterLink = { label: 'Home', href: '/', isExternal: 'yes' };
    void invalid;
  });

  it('accepts a valid FooterLink without the optional isExternal field', () => {
    const valid: FooterLink = { label: 'Home', href: '/' };
    expectTypeOf(valid).toEqualTypeOf<FooterLink>();
  });
});
