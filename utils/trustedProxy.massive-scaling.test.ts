import { describe, it, expect } from 'vitest';
import { isTrustedProxy, ip4ToInt, isIPv4InCidr, isIPv4 } from './trustedProxy';
import type { TrustedProxyConfig } from '../types/network';

describe('trustedProxy — Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('correctly checks 10000 trusted proxy IPs within performance limit', () => {
    const trustedProxies = Array.from(
      { length: 10000 },
      (_, i) => `10.0.${Math.floor(i / 256)}.${i % 256}`
    );
    const config: TrustedProxyConfig = { trustedProxies, trustPrivateRanges: false };

    const start = performance.now();
    const result = isTrustedProxy('10.0.0.1', config);
    const duration = performance.now() - start;

    expect(result).toBe(true);
    expect(duration).toBeLessThan(500);
  });

  it('performs 10000 sequential ip4ToInt conversions within performance limit', () => {
    const start = performance.now();

    for (let i = 0; i < 10000; i++) {
      const ip = `${(i >> 24) & 255}.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}`;
      ip4ToInt(ip);
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('performs 10000 CIDR membership checks within performance limit', () => {
    const cidrs = Array.from({ length: 10 }, (_, i) => `10.${i}.0.0/16`);

    const start = performance.now();

    for (let i = 0; i < 10000; i++) {
      const ip = `10.${i % 10}.${Math.floor(i / 10) % 256}.1`;
      cidrs.some((cidr) => isIPv4InCidr(ip, cidr));
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('validates 10000 IPv4 addresses without errors within performance limit', () => {
    const start = performance.now();

    for (let i = 0; i < 10000; i++) {
      const ip = `${i % 256}.${Math.floor(i / 256) % 256}.0.1`;
      isIPv4(ip);
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('correctly rejects 10000 untrusted IPs under high load within performance limit', () => {
    const config: TrustedProxyConfig = {
      trustedProxies: ['192.168.1.1'],
      trustPrivateRanges: false,
    };

    const start = performance.now();

    for (let i = 0; i < 10000; i++) {
      const ip = `8.8.${i % 256}.${Math.floor(i / 256) % 256}`;
      const result = isTrustedProxy(ip, config);
      expect(result).toBe(false);
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
