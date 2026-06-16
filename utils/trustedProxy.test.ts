import { describe, it, expect } from 'vitest';
import {
  isTrustedProxy,
  ip4ToInt,
  isIPv4InCidr,
  isIPv4,
  buildProxyConfig,
  loadTrustedProxyConfig,
} from './trustedProxy';

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
    expect(isTrustedProxy('127.0.0.1', config)).toBe(true);
    expect(isTrustedProxy('8.8.8.8', config)).toBe(false);
  });
});

describe('trustedProxy — Performance Benchmarks with Cached Subnet Masks', () => {
  it('isTrustedProxy lookup completes under 1ms for 1000-entry proxy list', () => {
    const trustedProxies = Array.from(
      { length: 1000 },
      (_, i) => `10.0.${Math.floor(i / 255)}.${i % 255}`
    );
    const config = { trustedProxies, trustPrivateRanges: false };

    const start = performance.now();
    isTrustedProxy('10.0.0.1', config);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1);
  });

  it('buildProxyConfig pre-processes 1000 entries under 2ms', () => {
    const trustedProxies = [
      '*',
      ...Array.from({ length: 500 }, (_, i) => `192.168.${Math.floor(i / 255)}.${i % 255}`),
      ...Array.from({ length: 499 }, (_, i) => `10.0.${Math.floor(i / 255)}.${i % 255}/24`),
    ];
    const config = { trustedProxies, trustPrivateRanges: true };

    const start = performance.now();
    buildProxyConfig(config);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(5);
  });

  it('loadTrustedProxyConfig returns memoized result on repeated calls', () => {
    const first = loadTrustedProxyConfig();
    const start = performance.now();
    const second = loadTrustedProxyConfig();
    const duration = performance.now() - start;

    expect(first).toBe(second);
    expect(duration).toBeLessThan(1);
  });
});
