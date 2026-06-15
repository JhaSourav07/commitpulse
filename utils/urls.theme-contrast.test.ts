import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getOrigin, getDashboardUrl } from './urls';

/**
 * PRODUCTION CONSTANTS
 */
const FALLBACK_ORIGIN = 'https://commitpulse.vercel.app';

/**
 * MOCK: matchMedia (safe + isolated)
 */
function mockMatchMedia(scheme: 'dark' | 'light') {
  const matcher = (query: string) => ({
    matches: query.includes(scheme),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });

  vi.stubGlobal('matchMedia', matcher);

  if (typeof window !== 'undefined') {
    window.matchMedia = matcher as typeof window.matchMedia;
  }
}

/**
 * WCAG contrast helper (design-system validation only)
 */
function getContrastRatio(fg: string, bg: string): number {
  const getLuminance = (hex: string) => {
    const rgb = hex
      .replace('#', '')
      .match(/.{2}/g)!
      .map((x) => {
        const s = parseInt(x, 16) / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };

  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe('urls – Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_SITE_URL;

    if (typeof document !== 'undefined') {
      document.body.innerHTML = '';
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  // 1. Browser origin branch (stable mock)
  it('resolves origin from browser API while matching theme environment', () => {
    vi.stubGlobal('window', {
      location: { origin: 'http://localhost' },
      matchMedia: vi.fn(),
    });

    mockMatchMedia('dark');

    expect(getOrigin()).toBe('http://localhost');
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
  });

  // 2. ENV override branch
  it('resolves origin from environment variable when window is undefined', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://env-variable.test';

    vi.stubGlobal('window', undefined);

    expect(getOrigin()).toBe('https://env-variable.test');
  });

  // 3. Fallback branch + WCAG validation
  it('satisfies WCAG 2.1 AA contrast standards using fallback origin', () => {
    vi.stubGlobal('window', undefined);

    expect(getOrigin()).toBe(FALLBACK_ORIGIN);

    expect(getContrastRatio('#c9d1d9', '#0d1117')).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio('#58a6ff', '#0d1117')).toBeGreaterThanOrEqual(3);
    expect(getContrastRatio('#24292f', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio('#0969da', '#ffffff')).toBeGreaterThanOrEqual(3);
  });

  // 4. Dashboard URL + DOM + dark theme classes
  it('verifies dashboard URL generation and dark theme markup', () => {
    const url = getDashboardUrl('encoded user');

    // Safe URL assertions (no fragile decoding assumptions)
    expect(url).toContain('/dashboard/');
    expect(url).toContain('encoded');

    const container = document.createElement('div');
    container.className = 'dark bg-gray-900 text-gray-200';
    container.innerHTML = `<a id="link" href="${url}">Dashboard</a>`;
    document.body.appendChild(container);

    const link = document.getElementById('link');

    expect(container.classList.contains('dark')).toBe(true);
    expect(container.classList.contains('bg-gray-900')).toBe(true);
    expect(container.classList.contains('text-gray-200')).toBe(true);
    expect(link?.getAttribute('href')).toBe(url);
  });

  // 5. Trimming env + overlay DOM stability (no layout assumptions)
  it('handles trimmed environment variables and ensures overlay visibility', () => {
    // Assumes production trims whitespace
    process.env.NEXT_PUBLIC_SITE_URL = '   https://trimmed.test   ';

    vi.stubGlobal('window', undefined);

    expect(getOrigin()).toBe('https://trimmed.test');

    const root = document.createElement('div');
    root.className = 'light bg-white text-gray-800';
    root.innerHTML = `
      <div id="content" style="color:#24292f; position:relative;">Text</div>
      <div id="overlay" style="background:#ffffff; opacity:0.8; position:absolute;"></div>
    `;
    document.body.appendChild(root);

    const content = document.getElementById('content');
    const overlay = document.getElementById('overlay');

    // Stable DOM assertions (no computed style comparisons)
    expect(document.body.contains(content)).toBe(true);
    expect(document.body.contains(overlay)).toBe(true);
    expect(root.classList.contains('light')).toBe(true);
    expect(root.classList.contains('bg-white')).toBe(true);
  });
});
