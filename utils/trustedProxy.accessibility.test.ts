import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ip4ToInt,
  isIPv4InCidr,
  isIPv4,
  isTrustedProxy,
  loadTrustedProxyConfig,
} from './trustedProxy';

describe('trustedProxy - Accessibility Standards & Screen Reader Aria Compliance', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('Aria Label Compliance: ip4ToInt converts a correctly labeled IPv4 address to its unique 32-bit identity', () => {
    // Each IP is a unique "label" — its integer form must unambiguously identify it
    expect(ip4ToInt('0.0.0.0')).toBe(0);
    expect(ip4ToInt('255.255.255.255')).toBe(4294967295);
    expect(ip4ToInt('192.168.1.1')).toBe(3232235777);
    expect(ip4ToInt('10.0.0.1')).toBe(167772161);

    // Two different IPs must produce two different label identities
    expect(ip4ToInt('192.168.1.1')).not.toBe(ip4ToInt('192.168.1.2'));
  });

  it('Focus Outline Behavior: isIPv4InCidr remains callable and returns false gracefully for malformed CIDR inputs', () => {
    // Malformed inputs must not throw — the function must stay accessible after invalid input
    expect(() => isIPv4InCidr('192.168.1.1', 'not-a-cidr')).not.toThrow();
    expect(() => isIPv4InCidr('192.168.1.1', '192.168.1.0/999')).not.toThrow();
    expect(() => isIPv4InCidr('not-an-ip', '192.168.1.0/24')).not.toThrow();
    expect(() => isIPv4InCidr('', '')).not.toThrow();

    // All malformed inputs must return false — no stuck/broken state
    expect(isIPv4InCidr('192.168.1.1', 'not-a-cidr')).toBe(false);
    expect(isIPv4InCidr('192.168.1.1', '192.168.1.0/999')).toBe(false);
  });

  it('Tooltip Announcement: isIPv4 correctly announces whether an address is a valid IPv4 descriptor', () => {
    // Valid IPv4 addresses — tooltip should announce "this is a valid IPv4"
    expect(isIPv4('192.168.1.1')).toBe(true);
    expect(isIPv4('0.0.0.0')).toBe(true);
    expect(isIPv4('255.255.255.255')).toBe(true);
    expect(isIPv4('10.0.0.1')).toBe(true);

    // Invalid — tooltip should announce "this is NOT a valid IPv4"
    expect(isIPv4('256.0.0.1')).toBe(false);
    expect(isIPv4('192.168.1')).toBe(false);
    expect(isIPv4('::1')).toBe(false);
    expect(isIPv4('')).toBe(false);
    expect(isIPv4('192.168.1.01')).toBe(false); // leading zeros
  });

  it('Tab Ordering: isTrustedProxy checks wildcard first, then exact match, then CIDR, then private ranges in correct sequence', () => {
    // Tab stop 1: wildcard — trusts everything immediately
    expect(isTrustedProxy('1.2.3.4', { trustedProxies: ['*'], trustPrivateRanges: false })).toBe(
      true
    );

    // Tab stop 2: exact match — trusts only the named IP
    expect(
      isTrustedProxy('10.0.0.5', { trustedProxies: ['10.0.0.5'], trustPrivateRanges: false })
    ).toBe(true);
    expect(
      isTrustedProxy('10.0.0.6', { trustedProxies: ['10.0.0.5'], trustPrivateRanges: false })
    ).toBe(false);

    // Tab stop 3: CIDR range match
    expect(
      isTrustedProxy('192.168.1.50', {
        trustedProxies: ['192.168.1.0/24'],
        trustPrivateRanges: false,
      })
    ).toBe(true);
    expect(
      isTrustedProxy('192.168.2.1', {
        trustedProxies: ['192.168.1.0/24'],
        trustPrivateRanges: false,
      })
    ).toBe(false);

    // Tab stop 4: private ranges fallback (last in sequence)
    expect(isTrustedProxy('10.0.0.1', { trustedProxies: [], trustPrivateRanges: true })).toBe(true);
    expect(isTrustedProxy('8.8.8.8', { trustedProxies: [], trustPrivateRanges: true })).toBe(false);
  });

  it('Heading Hierarchy: loadTrustedProxyConfig reads env vars first then applies dev fallback in correct logical order', () => {
    // h1 level: TRUSTED_PROXIES env var is parsed first
    vi.stubEnv('TRUSTED_PROXIES', '10.0.0.1, 10.0.0.2');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TRUST_PRIVATE_PROXIES', 'false');

    let config = loadTrustedProxyConfig();

    // Top-level heading: env proxies must be present and correctly parsed
    expect(config.trustedProxies).toContain('10.0.0.1');
    expect(config.trustedProxies).toContain('10.0.0.2');
    expect(config.trustedProxies).toHaveLength(2);

    // h2 level: trustPrivateRanges defaults to true in dev regardless of env
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('TRUSTED_PROXIES', '');
    vi.stubEnv('TRUST_PRIVATE_PROXIES', 'false');

    config = loadTrustedProxyConfig();

    // Dev fallback must override the env flag — correct hierarchy
    expect(config.trustPrivateRanges).toBe(true);

    // h3 level: TRUST_PRIVATE_PROXIES=true enables private ranges in production
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TRUST_PRIVATE_PROXIES', 'true');

    config = loadTrustedProxyConfig();
    expect(config.trustPrivateRanges).toBe(true);
  });
});
