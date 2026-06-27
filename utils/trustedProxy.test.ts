import { describe, it, expect } from 'vitest';
import {
  isTrustedProxy,
  ip4ToInt,
  isIPv4InCidr,
  isIPv4,
  buildProxyConfig,
  loadTrustedProxyConfig,
  ip6ToBigInt,
  parseCidr6,
} from './trustedProxy';

describe('IPv6 parsing utilities', () => {
  it('correctly converts IPv6 to BigInt', () => {
    expect(ip6ToBigInt('::1')).toBe(BigInt(1));
    expect(ip6ToBigInt('0:0:0:0:0:0:0:1')).toBe(BigInt(1));
    expect(ip6ToBigInt('2001:db8::')).toBe(BigInt('42540766411282592856903984951653826560')); // 2001:0db8 followed by 0s
    expect(ip6ToBigInt('::')).toBe(BigInt(0));
    expect(ip6ToBigInt('invalid')).toBe(null);
  });

  it('correctly parses IPv6 CIDR', () => {
    const cidr = parseCidr6('2001:db8::/32');
    expect(cidr).not.toBeNull();
    expect(cidr?.rangeBigInt).toBe(BigInt('42540766411282592856903984951653826560'));
    expect(cidr?.mask).toBe(BigInt('340282366841710300949110269838224261120')); // 32 1s, 96 0s
  });
});

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

  it('correctly determines trusted proxies for IPv4', () => {
    const config = {
      trustedProxies: ['192.168.1.1', '10.0.0.0/8'],
      trustPrivateRanges: true,
    };
    expect(isTrustedProxy('192.168.1.1', config)).toBe(true);
    expect(isTrustedProxy('10.5.5.5', config)).toBe(true);
    expect(isTrustedProxy('127.0.0.1', config)).toBe(true);
    expect(isTrustedProxy('8.8.8.8', config)).toBe(false);
  });

  it('correctly matches IPv6 CIDR ranges', () => {
    const config = {
      trustedProxies: ['2001:db8::/32'],
      trustPrivateRanges: false,
    };
    expect(isTrustedProxy('2001:db8::1', config)).toBe(true);
    expect(isTrustedProxy('2001:db8:ffff:ffff:ffff:ffff:ffff:ffff', config)).toBe(true);
    expect(isTrustedProxy('2001:db9::1', config)).toBe(false);
  });

  it('correctly matches exact IPv6 proxies', () => {
    const config = {
      trustedProxies: ['2001:db8::100'],
      trustPrivateRanges: false,
    };
    expect(isTrustedProxy('2001:db8::100', config)).toBe(true);
    expect(isTrustedProxy('2001:db8::101', config)).toBe(false);
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

    expect(duration).toBeLessThan(10);
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

    expect(duration).toBeLessThan(10);
  });

  it('loadTrustedProxyConfig returns memoized result on repeated calls', () => {
    const first = loadTrustedProxyConfig();
    const start = performance.now();
    const second = loadTrustedProxyConfig();
    const duration = performance.now() - start;

    expect(first).toBe(second);
    expect(duration).toBeLessThan(5);
  });
});
