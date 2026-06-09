import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getClientIp } from './getClientIp';
import { NextRequest } from 'next/server';

vi.mock('./trustedProxy', () => ({
  loadTrustedProxyConfig: vi.fn(() => ({
    trustedProxies: [],
    trustPrivateRanges: false,
  })),
  isTrustedProxy: vi.fn(() => false),
}));

describe('getClientIp Accessibility Standards & Screen Reader Aria Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns x-real-ip when x-forwarded-for is not trusted', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '1.1.1.1',
        'x-real-ip': '2.2.2.2',
      },
    });

    expect(getClientIp(request)).toBe('2.2.2.2');
  });

  it('returns priority header value when available', () => {
    const request = new Request('http://localhost', {
      headers: {
        'cf-connecting-ip': '8.8.8.8',
      },
    });

    expect(getClientIp(request)).toBe('8.8.8.8');
  });

  it('returns x-real-ip when present in priority headers', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-real-ip': '9.9.9.9',
      },
    });

    expect(getClientIp(request)).toBe('9.9.9.9');
  });

  it('returns localhost fallback in test environment', () => {
    const request = new Request('http://localhost');

    expect(getClientIp(request)).toBe('127.0.0.1');
  });

  it('uses NextRequest ip when available', () => {
    const request = new NextRequest('http://localhost');

    Object.defineProperty(request, 'ip', {
      value: '123.123.123.123',
    });

    expect(getClientIp(request)).toBe('123.123.123.123');
  });
});
