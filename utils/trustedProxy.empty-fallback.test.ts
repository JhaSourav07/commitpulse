import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  isIPv4,
  ip4ToInt,
  isIPv4InCidr,
  isTrustedProxy,
  loadTrustedProxyConfig,
} from './trustedProxy';

describe('trustedProxy - Edge Cases & Empty/Missing Inputs Verification', () => {
  beforeEach(() => {
    delete process.env.TRUSTED_PROXIES;
    delete process.env.TRUST_PRIVATE_PROXIES;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
  });

  it('1. isIPv4 returns false for empty, malformed, or non-IP strings', () => {
    expect(isIPv4('')).toBe(false);
    expect(isIPv4('   ')).toBe(false);
    expect(isIPv4('.')).toBe(false);
    expect(isIPv4('256.0.0.1')).toBe(false);
    expect(isIPv4('1.2.3.4.5')).toBe(false);
    expect(isIPv4('not-an-ip')).toBe(false);
  });

  it('2. ip4ToInt correctly converts an IP to its integer representation', () => {
    expect(ip4ToInt('0.0.0.0')).toBe(0);
    expect(ip4ToInt('127.0.0.1')).toBe(2130706433);
    expect(ip4ToInt('255.255.255.255')).toBe(4294967295);
  });

  it('3. isIPv4InCidr gracefully rejects invalid CIDR notation without throwing', () => {
    expect(isIPv4InCidr('192.168.1.1', '')).toBe(false);
    expect(isIPv4InCidr('192.168.1.1', 'not-a-cidr')).toBe(false);
    expect(isIPv4InCidr('192.168.1.1', '10.0.0.0/invalid')).toBe(false);
    expect(isIPv4InCidr('192.168.1.1', '10.0.0.0/33')).toBe(false);
  });

  it('4. isTrustedProxy handles empty trustedProxies list and missing trustPrivateRanges', () => {
    expect(isTrustedProxy('10.0.0.1', { trustedProxies: [], trustPrivateRanges: false })).toBe(
      false
    );
    expect(isTrustedProxy('10.0.0.1', { trustedProxies: [], trustPrivateRanges: true })).toBe(true);
  });

  it('5. isTrustedProxy accepts wildcard and exact-match entries even with empty config', () => {
    expect(isTrustedProxy('1.2.3.4', { trustedProxies: ['*'], trustPrivateRanges: false })).toBe(
      true
    );
    expect(
      isTrustedProxy('10.0.0.1', { trustedProxies: ['10.0.0.1'], trustPrivateRanges: false })
    ).toBe(true);
    expect(
      isTrustedProxy('10.0.0.2', { trustedProxies: ['10.0.0.1'], trustPrivateRanges: false })
    ).toBe(false);
  });

  it('6. loadTrustedProxyConfig returns sensible defaults when no env vars are set in production', () => {
    const config = loadTrustedProxyConfig();
    expect(config.trustedProxies).toEqual([]);
    expect(config.trustPrivateRanges).toBe(false);
  });
});
