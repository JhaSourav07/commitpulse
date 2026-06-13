import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getClientIp } from './getClientIp';

/**
 * Helper to dynamically mock the window.matchMedia API
 * to satisfy the "dual theme environment mock" requirement.
 */
function mockColorScheme(theme: 'light' | 'dark') {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes(theme),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('getClientIp — Dark & Light Prefers-Color-Scheme Visual Cohesion (Variation 3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('should resolve the client IP from a NextRequest when light mode environment is emulated', () => {
    mockColorScheme('light');
    const req = new NextRequest('http://localhost:3000/api/streak');
    Object.defineProperty(req, 'ip', { value: '203.0.113.10', writable: true });

    const ip = getClientIp(req);
    expect(ip).toBe('203.0.113.10');
    expect(window.matchMedia('(prefers-color-scheme: light)').matches).toBe(true);
  });

  test('should resolve the client IP from a NextRequest when dark mode environment is emulated', () => {
    mockColorScheme('dark');
    const req = new NextRequest('http://localhost:3000/api/streak');
    Object.defineProperty(req, 'ip', { value: '203.0.113.10', writable: true });

    const ip = getClientIp(req);
    expect(ip).toBe('203.0.113.10');
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
  });

  test('should reject spoofed X-Forwarded-For headers with correct contrast-boundary IP resolution', () => {
    mockColorScheme('dark');
    const req = new NextRequest('http://localhost:3000/api/streak', {
      headers: { 'x-forwarded-for': '198.51.100.5, 203.0.113.10' },
    });
    Object.defineProperty(req, 'ip', { value: '203.0.113.10', writable: true });

    const ip = getClientIp(req);
    expect(ip).toBe('203.0.113.10');
  });

  test('should honour custom priority header order consistently across theme environments', () => {
    mockColorScheme('light');
    const req = new Request('http://localhost:3000/api/streak', {
      headers: { 'x-real-ip': '10.0.0.1' },
    });

    const ip = getClientIp(req, {
      headersPriority: ['x-real-ip'],
      proxyConfig: { trustedProxies: ['127.0.0.1'], trustPrivateRanges: true },
      directIp: '127.0.0.1',
    });
    expect(ip).toBe('10.0.0.1');

    mockColorScheme('dark');
    const ipDark = getClientIp(req, {
      headersPriority: ['x-real-ip'],
      proxyConfig: { trustedProxies: ['127.0.0.1'], trustPrivateRanges: true },
      directIp: '127.0.0.1',
    });
    expect(ipDark).toBe('10.0.0.1');
  });

  test('should fall back to 127.0.0.1 when no IP headers are present, regardless of color scheme', () => {
    mockColorScheme('light');
    const req = new Request('http://localhost:3000/api/streak');
    expect(getClientIp(req)).toBe('127.0.0.1');

    mockColorScheme('dark');
    expect(getClientIp(req)).toBe('127.0.0.1');
  });
});
