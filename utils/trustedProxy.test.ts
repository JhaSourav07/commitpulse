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
