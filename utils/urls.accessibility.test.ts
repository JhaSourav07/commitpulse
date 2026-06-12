import { afterEach, describe, expect, it, vi } from 'vitest';
import { getOrigin, getDashboardUrl } from './urls';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe('getOrigin', () => {
  it('trims NEXT_PUBLIC_SITE_URL and discards whitespace-only values to the hardcoded fallback', () => {
    vi.stubGlobal('window', undefined);

    // Whitespace-only must be treated as absent — tests the .trim() + || null chain
    process.env.NEXT_PUBLIC_SITE_URL = '   ';
    expect(getOrigin()).toBe('https://commitpulse.vercel.app');

    // Env var with surrounding whitespace must be trimmed before use, not used raw
    process.env.NEXT_PUBLIC_SITE_URL = '  https://staging.example.com  ';
    expect(getOrigin()).toBe('https://staging.example.com');
  });

  it('treats empty string NEXT_PUBLIC_SITE_URL as absent via || null and falls through to fallback', () => {
    vi.stubGlobal('window', undefined);

    // Empty string coerces to null via || null — tests that branch specifically
    process.env.NEXT_PUBLIC_SITE_URL = '';
    expect(getOrigin()).toBe('https://commitpulse.vercel.app');
  });

  it('returns window.location.origin when window is defined, ignoring NEXT_PUBLIC_SITE_URL', () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
    process.env.NEXT_PUBLIC_SITE_URL = 'https://should-not-be-used.com';

    // window must take priority — tests the typeof window !== 'undefined' branch
    expect(getOrigin()).toBe('http://localhost:3000');
  });

  it('falls through to NEXT_PUBLIC_SITE_URL when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    process.env.NEXT_PUBLIC_SITE_URL = 'https://env-origin.com';

    expect(getOrigin()).toBe('https://env-origin.com');
  });

  it('returns hardcoded fallback when both window and NEXT_PUBLIC_SITE_URL are absent', () => {
    vi.stubGlobal('window', undefined);
    delete process.env.NEXT_PUBLIC_SITE_URL;

    expect(getOrigin()).toBe('https://commitpulse.vercel.app');
  });
});

describe('getDashboardUrl', () => {
  it('applies encodeURIComponent to username — spaces, slashes, and @ symbols are encoded', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });

    // Tests that encodeURIComponent is called — raw interpolation would fail these
    expect(getDashboardUrl('user name')).toBe('https://example.com/dashboard/user%20name');
    expect(getDashboardUrl('user/name')).toBe('https://example.com/dashboard/user%2Fname');
    expect(getDashboardUrl('user@name')).toBe('https://example.com/dashboard/user%40name');
  });
});
