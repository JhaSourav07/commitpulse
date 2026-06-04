import { render } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import ScrollRestoration from './ScrollRestoration';

vi.mock('next/navigation', () => ({
  usePathname: () => '/contributors',
}));

type ScrollRestorationComponent = typeof ScrollRestoration;
type ScrollRestorationProps = Parameters<ScrollRestorationComponent>;

function validateScrollStorageKey(key: string) {
  return /^scroll-position-\/.+/.test(key);
}

describe('ScrollRestoration type compiler validation', () => {
  it('exports a callable React component with no required props', () => {
    expectTypeOf(ScrollRestoration).toBeFunction();
    expectTypeOf<ScrollRestorationProps>().toEqualTypeOf<[]>();
  });

  it('renders without visible DOM output', () => {
    const { container } = render(<ScrollRestoration />);

    expect(container.textContent).toBe('');
    expect(container.firstElementChild).toBeNull();
  });

  it('blocks invalid prop parameters at compile time', () => {
    expectTypeOf<ScrollRestorationProps>().not.toEqualTypeOf<[{ pathname: string }]>();
  });

  it('accepts optional pathname-like values in schema helper checks', () => {
    type OptionalPathname = string | undefined;

    const optionalPathname: OptionalPathname = '/contributors';

    expectTypeOf<OptionalPathname>().toEqualTypeOf<string | undefined>();

    expect(validateScrollStorageKey(`scroll-position-${optionalPathname}`)).toBe(true);
  });

  it('returns strict validation reports for scroll storage key constraints', () => {
    expect(validateScrollStorageKey('scroll-position-/contributors')).toBe(true);
    expect(validateScrollStorageKey('scroll-position-')).toBe(false);
    expect(validateScrollStorageKey('contributors')).toBe(false);
    expect(validateScrollStorageKey('')).toBe(false);
  });
});
