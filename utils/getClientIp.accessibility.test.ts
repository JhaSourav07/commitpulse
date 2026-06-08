import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { getClientIp } from './getClientIp';

describe('getClientIp header and proxy resolution', () => {
  it('returns a string IP address value', () => {
    const req = new Request('http://localhost:3000');

    const result = getClientIp(req);

    expect(result).toBeTypeOf('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('prefers request.ip when available on NextRequest', () => {
    const req = new NextRequest('http://localhost:3000');

    Object.defineProperty(req, 'ip', {
      configurable: true,
      value: '203.0.113.10',
    });

    expect(getClientIp(req)).toBe('203.0.113.10');
  });

  it('resolves the client IP through a trusted proxy chain', () => {
    const req = new Request('http://localhost:3000', {
      headers: {
        'x-forwarded-for': '198.51.100.5, 203.0.113.10, 127.0.0.1',
      },
    });

    const result = getClientIp(req, {
      proxyConfig: {
        trustedProxies: ['127.0.0.1', '203.0.113.10'],
        trustPrivateRanges: true,
      },
    });

    expect(result).toBe('198.51.100.5');
  });

  it('falls back to localhost when no IP metadata is available', () => {
    const req = new Request('http://localhost:3000');

    expect(getClientIp(req)).toBe('127.0.0.1');
  });

  it('ignores malformed x-forwarded-for header values', () => {
    const req = new Request('http://localhost:3000', {
      headers: {
        'x-forwarded-for': ' , , ',
      },
    });

    expect(getClientIp(req)).toBe('127.0.0.1');
  });
});
