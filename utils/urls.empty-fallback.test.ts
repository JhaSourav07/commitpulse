import { describe, expect, it, vi, afterEach } from 'vitest';
import { getOrigin, getDashboardUrl } from './urls';

const FALLBACK_ORIGIN = 'https://commitpulse.vercel.app';

describe('urls - Edge Cases & Empty/Missing Inputs Verification', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it('1. falls back to the hardcoded origin when window and env var are both absent', () => {
    vi.stubGlobal('window', undefined);
    expect(getOrigin()).toBe(FALLBACK_ORIGIN);
  });

  it('2. treats an empty NEXT_PUBLIC_SITE_URL as absent and falls back to hardcoded origin', () => {
    vi.stubGlobal('window', undefined);
    process.env.NEXT_PUBLIC_SITE_URL = '';
    expect(getOrigin()).toBe(FALLBACK_ORIGIN);

    process.env.NEXT_PUBLIC_SITE_URL = '   ';
    expect(getOrigin()).toBe(FALLBACK_ORIGIN);
  });

  it('3. returns window origin and ignores empty/missing env var when window is available', () => {
    vi.stubGlobal('window', { location: { origin: 'https://app.example.com' } });
    expect(getOrigin()).toBe('https://app.example.com');
  });

  it('4. returns a safe dashboard URL even when the username is an empty string', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });
    expect(getDashboardUrl('')).toBe('https://example.com/dashboard/');
  });

  it('5. encodes special characters in the username to prevent URL injection', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });
    expect(getDashboardUrl('user name')).toBe('https://example.com/dashboard/user%20name');
    expect(getDashboardUrl('../secret')).toBe('https://example.com/dashboard/..%2Fsecret');
    expect(getDashboardUrl('a<b>c')).toBe('https://example.com/dashboard/a%3Cb%3Ec');
  });

  it('6. falls back to hardcoded origin in dashboard URL when window and env var are absent', () => {
    vi.stubGlobal('window', undefined);
    expect(getDashboardUrl('octocat')).toBe(`${FALLBACK_ORIGIN}/dashboard/octocat`);
  });
});
