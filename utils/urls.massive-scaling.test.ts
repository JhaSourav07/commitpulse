import { describe, expect, it, vi, afterEach } from 'vitest';
import { getDashboardUrl, getOrigin } from './urls';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe('urls Massive Data Sets & Extreme High Bounds Scaling', () => {
  it('1. handles extremely long usernames without truncation or corruption', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });

    const massiveUsername = 'a'.repeat(100000);
    const url = getDashboardUrl(massiveUsername);

    expect(url.startsWith('https://example.com/dashboard/')).toBe(true);
    expect(url.endsWith(massiveUsername)).toBe(true);
  });

  it('2. safely encodes massive usernames containing spaces and special characters', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });

    const massiveUsername = 'john doe @#$%^&*() '.repeat(5000).trim();
    const url = getDashboardUrl(massiveUsername);

    expect(url).toContain(encodeURIComponent('john doe'));
    expect(url).toContain('%40');
  });

  it('3. processes massive volumes of dashboard URL generation within performance limits', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.com' } });

    const start = performance.now();

    for (let i = 0; i < 100000; i++) {
      getDashboardUrl(`user-${i}`);
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(process.env.CI ? 10000 : 3000);
  });

  it('4. handles extremely large NEXT_PUBLIC_SITE_URL values correctly', () => {
    vi.stubGlobal('window', undefined);

    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com/' + 'segment/'.repeat(5000);

    const origin = getOrigin();

    expect(new URL(origin).origin).toBe('https://example.com');
  });

  it('5. remains stable under repeated high-volume origin resolution calls', () => {
    vi.stubGlobal('window', undefined);
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.commitpulse.app';

    const start = performance.now();

    for (let i = 0; i < 100000; i++) {
      expect(getOrigin()).toBe('https://staging.commitpulse.app');
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(process.env.CI ? 10000 : 3000);
  });
});
