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

  it('uses direct client-supplied custom priority headers if available', () => {
    const req = new Request('http://localhost:3000/api/streak', {
      headers: {
        'cf-connecting-ip': '198.51.100.99',
      },
    });

    const ip = getClientIp(req);
    expect(ip).toBe('198.51.100.99');
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
    expect(ip).toBe('127.0.0.1'); // Default fallback because x-real-ip and others are missing
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
    });
    expect(ip).toBe('198.51.100.5');
  });
});
