import { describe, it, expect, vi, afterEach } from 'vitest';
import { getDashboardUrl, getOrigin } from './urls';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe('getOrigin', () => {
  it('returns window.location.origin when window is defined', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });

    expect(getOrigin()).toBe('https://example.com');
  });

  it('falls back to NEXT_PUBLIC_SITE_URL when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.commitpulse.app';

    expect(getOrigin()).toBe('https://staging.commitpulse.app');
  });

  it('falls back to the hardcoded origin when both window and NEXT_PUBLIC_SITE_URL are absent', () => {
    vi.stubGlobal('window', undefined);

    expect(getOrigin()).toBe('https://commitpulse.vercel.app');
  });

  it('treats an empty NEXT_PUBLIC_SITE_URL as absent and falls back to the hardcoded origin', () => {
    vi.stubGlobal('window', undefined);
    process.env.NEXT_PUBLIC_SITE_URL = '';

    expect(getOrigin()).toBe('https://commitpulse.vercel.app');
  });

  it('treats a whitespace-only NEXT_PUBLIC_SITE_URL as absent and falls back to the hardcoded origin', () => {
    vi.stubGlobal('window', undefined);
    process.env.NEXT_PUBLIC_SITE_URL = '   ';

    expect(getOrigin()).toBe('https://commitpulse.vercel.app');
  });
});

describe('getDashboardUrl', () => {
  it('returns the correct dashboard URL using window.location.origin', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });

    expect(getDashboardUrl('octocat')).toBe('https://example.com/dashboard/octocat');
  });

  it('falls back to NEXT_PUBLIC_SITE_URL when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.commitpulse.app';

    expect(getDashboardUrl('octocat')).toBe('https://staging.commitpulse.app/dashboard/octocat');
  });

  it('falls back to the hardcoded origin when both window and NEXT_PUBLIC_SITE_URL are absent', () => {
    vi.stubGlobal('window', undefined);

    expect(getDashboardUrl('octocat')).toBe('https://commitpulse.vercel.app/dashboard/octocat');
  });

  it('includes the username in the path', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });

    expect(getDashboardUrl('torvalds')).toBe('https://example.com/dashboard/torvalds');
  });
});
