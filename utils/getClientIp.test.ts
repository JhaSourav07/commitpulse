import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { getClientIp } from './getClientIp';

describe('getClientIp', () => {
  it('prefers request.ip on NextRequest if available', () => {
    const req = new NextRequest('http://localhost:3000/api/streak');
    Object.defineProperty(req, 'ip', { value: '203.0.113.10', writable: true });

    const ip = getClientIp(req);
    expect(ip).toBe('203.0.113.10');
  });

  it('ignores spoofed X-Forwarded-For when request.ip is present', () => {
    const req = new NextRequest('http://localhost:3000/api/streak', {
      headers: {
        'x-forwarded-for': '198.51.100.5, 203.0.113.10',
      },
    });
    Object.defineProperty(req, 'ip', { value: '203.0.113.10', writable: true });

    const ip = getClientIp(req);
    expect(ip).toBe('203.0.113.10');
  });

  it('ignores direct client-supplied custom priority headers', () => {
    const req = new Request('http://localhost:3000/api/streak', {
      headers: {
        'cf-connecting-ip': '198.51.100.99',
      },
    });

    const ip = getClientIp(req);
    expect(ip).toBe('127.0.0.1');
  });

  it('ignores x-forwarded-for entirely when no trusted proxies are configured', () => {
    const req = new Request('http://localhost:3000/api/streak', {
      headers: {
        'x-forwarded-for': '198.51.100.5, 203.0.113.10',
      },
    });

    const ip = getClientIp(req, {
      proxyConfig: { trustedProxies: [], trustPrivateRanges: false },
    });
    expect(ip).toBe('127.0.0.1');
  });

  it('extracts correct IP through a trusted proxy chain', () => {
    const req = new Request('http://localhost:3000/api/streak', {
      headers: {
        'x-forwarded-for': '198.51.100.5, 203.0.113.10, 127.0.0.1',
      },
    });

    // We trust localhost (127.0.0.1) and 203.0.113.10 as proxies, so the true client is 198.51.100.5
    const ip = getClientIp(req, {
      proxyConfig: {
        trustedProxies: ['127.0.0.1', '203.0.113.10'],
        trustPrivateRanges: true,
      },
      directIp: '127.0.0.1',
    });
    expect(ip).toBe('198.51.100.5');
  });

  it('stops at the first untrusted proxy in the chain', () => {
    const req = new Request('http://localhost:3000/api/streak', {
      headers: {
        'x-forwarded-for': '198.51.100.5, 8.8.8.8, 127.0.0.1',
      },
    });

    // 127.0.0.1 is trusted. 8.8.8.8 is not. So the resolved IP must be 8.8.8.8.
    const ip = getClientIp(req, {
      proxyConfig: {
        trustedProxies: ['127.0.0.1'],
        trustPrivateRanges: true,
      },
      directIp: '127.0.0.1',
    });
    expect(ip).toBe('8.8.8.8');
  });

  it('supports wildcards to trust all proxies (trust-all behavior)', () => {
    const req = new Request('http://localhost:3000/api/streak', {
      headers: {
        'x-forwarded-for': '198.51.100.5, 203.0.113.10',
      },
    });

    const ip = getClientIp(req, {
      proxyConfig: {
        trustedProxies: ['*'],
        trustPrivateRanges: false,
      },
      directIp: '203.0.113.10',
    });
    expect(ip).toBe('198.51.100.5');
  });

  it('sanitizes multi-IP lists and traverses untrusted hops from right to left', () => {
    const req = new Request('http://localhost:3000/api/streak', {
      headers: {
        'x-forwarded-for': '203.0.113.195, 198.51.100.10, 192.168.1.1',
      },
    });
    const options = {
      proxyConfig: {
        trustedProxies: ['192.168.1.1'],
        trustPrivateRanges: false,
      },
      directIp: '192.168.1.1',
    };
    expect(getClientIp(req, options)).toBe('198.51.100.10');
  });

  it('returns the direct peer and ignores spoofed headers when the peer is not trusted', () => {
    const req = new Request('http://localhost:3000/api/streak', {
      headers: {
        'x-forwarded-for': '127.0.0.1',
        'x-real-ip': '127.0.0.1',
        'cf-connecting-ip': '127.0.0.1',
      },
    });

    expect(
      getClientIp(req, {
        proxyConfig: { trustedProxies: ['10.0.0.1'], trustPrivateRanges: false },
        directIp: '198.51.100.25',
      })
    ).toBe('198.51.100.25');
  });

  it('does not allow rotating forwarded headers to rotate the resolved IP', () => {
    const options = {
      proxyConfig: { trustedProxies: [], trustPrivateRanges: false },
      directIp: '198.51.100.25',
    };

    const first = new Request('http://localhost/api/streak', {
      headers: { 'x-real-ip': '1.1.1.1' },
    });
    const second = new Request('http://localhost/api/streak', {
      headers: { 'x-real-ip': '8.8.8.8' },
    });

    expect(getClientIp(first, options)).toBe('198.51.100.25');
    expect(getClientIp(second, options)).toBe('198.51.100.25');
  });

  it('falls back to 127.0.0.1 when headers are missing or malformed', () => {
    const req = new Request('http://localhost:3000/api/streak');
    expect(getClientIp(req)).toBe('127.0.0.1');

    const reqMalformed = new Request('http://localhost:3000/api/streak', {
      headers: {
        'x-forwarded-for': '   ,   ',
      },
    });
    expect(getClientIp(reqMalformed)).toBe('127.0.0.1');
  });
  it('does not return a trusted proxy as the client IP when it is the only hop in the chain', () => {
    const req = new Request('http://localhost:3000/api/streak', {
      headers: {
        'x-forwarded-for': '203.0.113.5',
      },
    });

    const ip = getClientIp(req, {
      proxyConfig: {
        trustedProxies: ['203.0.113.5'],
        trustPrivateRanges: false,
      },
      directIp: '203.0.113.5',
    });

    expect(ip).toBe('127.0.0.1');
  });
});
