import { afterEach, describe, expect, it, vi } from 'vitest';
import { getOrigin, getDashboardUrl } from './urls';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe('urls - Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('Aria Label Compliance: getDashboardUrl correctly labels the URL with the username identity as the named path segment', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });

    const url = getDashboardUrl('octocat');

    // The username must appear as the final named label in the URL path
    expect(url).toBe('https://example.com/dashboard/octocat');
    expect(url).toContain('/dashboard/octocat');

    // Two different usernames must produce two distinct label identities
    expect(getDashboardUrl('userA')).not.toBe(getDashboardUrl('userB'));
  });

  it('Focus Outline Behavior: getOrigin and getDashboardUrl remain callable and return valid strings for edge case inputs', () => {
    vi.stubGlobal('window', undefined);
    delete process.env.NEXT_PUBLIC_SITE_URL;

    // Must not throw — functions must remain accessible after missing window and env
    expect(() => getOrigin()).not.toThrow();
    expect(() => getDashboardUrl('')).not.toThrow();
    expect(() => getDashboardUrl('   ')).not.toThrow();

    // Must still return a valid string fallback — no broken/stuck state
    expect(getOrigin()).toBe('https://commitpulse.vercel.app');
    expect(getDashboardUrl('')).toBe('https://commitpulse.vercel.app/dashboard/');
  });

  it('Tooltip Announcement: getDashboardUrl output correctly describes the full dashboard location for the given username', () => {
    vi.stubGlobal('window', { location: { origin: 'https://commitpulse.vercel.app' } });

    const url = getDashboardUrl('subhooo5');

    // URL must announce the full absolute path — correct tooltip description semantics
    expect(url).toMatch(/^https:\/\//);
    expect(url).toContain('/dashboard/');
    expect(url).toContain('subhooo5');
    expect(url).toBe('https://commitpulse.vercel.app/dashboard/subhooo5');
  });

  it('Tab Ordering: getOrigin resolves window first, then NEXT_PUBLIC_SITE_URL, then fallback in correct priority sequence', () => {
    // Priority 1 — window.location.origin (highest priority, first tab stop)
    vi.stubGlobal('window', { location: { origin: 'https://window-origin.com' } });
    process.env.NEXT_PUBLIC_SITE_URL = 'https://env-origin.com';
    expect(getOrigin()).toBe('https://window-origin.com');

    // Priority 2 — NEXT_PUBLIC_SITE_URL when window is unavailable (second tab stop)
    vi.stubGlobal('window', undefined);
    process.env.NEXT_PUBLIC_SITE_URL = 'https://env-origin.com';
    expect(getOrigin()).toBe('https://env-origin.com');

    // Priority 3 — hardcoded fallback when both are unavailable (last tab stop)
    vi.stubGlobal('window', undefined);
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getOrigin()).toBe('https://commitpulse.vercel.app');
  });

  it('Heading Hierarchy: getDashboardUrl encodes special characters in the correct logical order preserving URL structure', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });

    // Username with special characters must be encoded — structural hierarchy preserved
    const urlWithSpace = getDashboardUrl('user name');
    expect(urlWithSpace).toBe('https://example.com/dashboard/user%20name');
    expect(urlWithSpace).toContain('/dashboard/');

    // Username with slash must be encoded — path hierarchy must not break
    const urlWithSlash = getDashboardUrl('user/name');
    expect(urlWithSlash).toBe('https://example.com/dashboard/user%2Fname');
    expect(urlWithSlash).not.toContain('/dashboard/user/name');

    // Normal username must pass through without encoding — clean hierarchy
    const urlClean = getDashboardUrl('octocat');
    expect(urlClean).toBe('https://example.com/dashboard/octocat');
  });
});
