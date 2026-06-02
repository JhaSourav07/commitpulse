import { describe, it, expect } from 'vitest';
import { getClientIp } from './getClientIp';
import { isTrustedProxy, ip4ToInt, isIPv4InCidr, isIPv4 } from './trustedProxy';
import { NextRequest } from 'next/server';

describe('isTrustedProxy and Helpers', () => {
  it('correctly checks if an IP is valid IPv4', () => {
    expect(isIPv4('127.0.0.1')).toBe(true);
    expect(isIPv4('192.168.1.100')).toBe(true);
    expect(isIPv4('256.0.0.1')).toBe(false);
    expect(isIPv4('abc.def.ghi.jkl')).toBe(false);
  });

  it('correctly converts IPv4 to integer', () => {
    expect(ip4ToInt('127.0.0.1')).toBe(2130706433);
  });

  it('correctly checks if an IP is within a CIDR range', () => {
    expect(isIPv4InCidr('192.168.1.50', '192.168.1.0/24')).toBe(true);
    expect(isIPv4InCidr('192.168.2.50', '192.168.1.0/24')).toBe(false);
  });

  it('correctly determines trusted proxies', () => {
    const config = {
      trustedProxies: ['192.168.1.1', '10.0.0.0/8'],
      trustPrivateRanges: true,
    };
    expect(isTrustedProxy('192.168.1.1', config)).toBe(true);
    expect(isTrustedProxy('10.5.5.5', config)).toBe(true);
    expect(isTrustedProxy('127.0.0.1', config)).toBe(true); // private range fallback
    expect(isTrustedProxy('8.8.8.8', config)).toBe(false);
  });
});

describe('getClientIp extraction and fallback', () => {
  // Test Case 1: extraction of IP from single X-Forwarded-For header
  it('extracts IP from a single X-Forwarded-For header when proxy is trusted', () => {
    const req = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '203.0.113.195',
      },
    });
    const options = {
      proxyConfig: {
        trustedProxies: ['*'],
        trustPrivateRanges: false,
      },
    };
    expect(getClientIp(req, options)).toBe('203.0.113.195');
  });

  // Test Case 2: sanitization of multi-IP lists
  it('sanitizes multi-IP lists and traverses untrusted hops from right to left', () => {
    const req = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '203.0.113.195, 198.51.100.10, 192.168.1.1',
      },
    });
    const options = {
      proxyConfig: {
        trustedProxies: ['192.168.1.1'],
        trustPrivateRanges: false,
      },
    };
    expect(getClientIp(req, options)).toBe('198.51.100.10');
  });

  // Test Case 3: Cloudflare Cf-Connecting-Ip has precedence
  it('gives precedence to priority headers like cf-connecting-ip', () => {
    const req = new Request('http://localhost', {
      headers: {
        'cf-connecting-ip': '203.0.113.5',
        'x-real-ip': '198.51.100.20',
      },
    });
    const options = {
      headersPriority: ['cf-connecting-ip', 'x-real-ip'],
      proxyConfig: {
        trustedProxies: [],
        trustPrivateRanges: false,
      },
    };
    expect(getClientIp(req, options)).toBe('203.0.113.5');
  });

  // Test Case 4: fallback to connection remoteAddress (request.ip)
  it('falls back to request.ip representing connection remoteAddress', () => {
    const req = new NextRequest('http://localhost');
    Object.defineProperty(req, 'ip', { value: '198.51.100.5', configurable: true });

    expect(getClientIp(req)).toBe('198.51.100.5');
  });

  // Test Case 5: behavior when headers are missing or malformed
  it('falls back to 127.0.0.1 when headers are missing or malformed', () => {
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('127.0.0.1');

    const reqMalformed = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '   ,   ',
      },
    });
    expect(getClientIp(reqMalformed)).toBe('127.0.0.1');
  });
});
