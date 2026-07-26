import { describe, it, expect, vi, afterEach } from 'vitest';
import { getDashboardUrl, getOrigin } from './urls';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe('urls accessibility coverage', () => {
  it('prefers window.location.origin over NEXT_PUBLIC_SITE_URL', () => {
    vi.stubGlobal('window', { location: { origin: 'https://browser.example' } });
    process.env.NEXT_PUBLIC_SITE_URL = 'https://env.example';

    expect(getOrigin()).toBe('https://browser.example');
  });

  it('trims surrounding whitespace from NEXT_PUBLIC_SITE_URL', () => {
    vi.stubGlobal('window', undefined);
    process.env.NEXT_PUBLIC_SITE_URL = '  https://staging.commitpulse.app  ';

    expect(getOrigin()).toBe('https://staging.commitpulse.app');
  });

  it('encodes reserved URL characters in usernames', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });

    expect(getDashboardUrl('john/doe?test=yes')).toBe(
      'https://example.com/dashboard/john%2Fdoe%3Ftest%3Dyes'
    );
  });

  it('supports unicode usernames safely', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });

    expect(getDashboardUrl('देव')).toContain(encodeURIComponent('देव'));
  });

  it('always returns an absolute dashboard URL', () => {
    vi.stubGlobal('window', undefined);
    delete process.env.NEXT_PUBLIC_SITE_URL;

    expect(getDashboardUrl('octocat')).toMatch(/^https:\/\/.+\/dashboard\/octocat$/);
  });
});
