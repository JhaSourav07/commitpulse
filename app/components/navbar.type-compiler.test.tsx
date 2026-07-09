import { describe, it, expectTypeOf } from 'vitest';
import type { NavLink } from './navbar';

describe('Navbar Type Compiler Validation', () => {
  it('enforces all required fields on NavLink (no optional properties)', () => {
    expectTypeOf<NavLink>().toHaveProperty('label').toEqualTypeOf<string>();
    expectTypeOf<NavLink>().toHaveProperty('href').toEqualTypeOf<string>();
    expectTypeOf<NavLink>().toHaveProperty('isExternal').toEqualTypeOf<boolean>();
    expectTypeOf<NavLink>().toHaveProperty('isPrimary').toEqualTypeOf<boolean>();
  });

  it('rejects a NavLink object missing a required field at compile time', () => {
    // @ts-expect-error - missing required `isPrimary`
    const invalid: NavLink = { label: 'Compare', href: '/compare', isExternal: false };
    void invalid;
  });

  it('rejects a NavLink object with wrong field types at compile time', () => {
    const invalid: NavLink = {
      label: 'Compare',
      href: '/compare',
      // @ts-expect-error - isExternal must be boolean, not string
      isExternal: 'no',
      isPrimary: false,
    };
    void invalid;
  });

  it('rejects a NavLink object with an unknown extra property at compile time', () => {
    const invalid: NavLink = {
      label: 'Compare',
      href: '/compare',
      isExternal: false,
      isPrimary: false,
      // @ts-expect-error - `target` is not a property of NavLink
      target: '_blank',
    };
    void invalid;
  });

  it('accepts a fully valid NavLink object matching the exact shape', () => {
    const valid: NavLink = {
      label: 'GitHub Repo',
      href: 'https://github.com/JhaSourav07/commitpulse',
      isExternal: true,
      isPrimary: true,
    };
    expectTypeOf(valid).toEqualTypeOf<NavLink>();
  });
});
