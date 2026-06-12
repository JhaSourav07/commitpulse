import { describe, expect, it } from 'vitest';
import { ip4ToInt, isIPv4, isIPv4InCidr, isTrustedProxy } from './trustedProxy';

describe('Trusted Proxy Utilities', () => {
  it('validates IPv4 addresses correctly', () => {
    expect(isIPv4('192.168.1.1')).toBe(true);
    expect(isIPv4('999.999.999.999')).toBe(false);
  });

  it('converts IPv4 to integer representation', () => {
    expect(ip4ToInt('127.0.0.1')).toBe(2130706433);
  });

  it('matches IPv4 addresses within CIDR ranges', () => {
    expect(isIPv4InCidr('192.168.1.10', '192.168.0.0/16')).toBe(true);
  });

  it('trusts exact proxy matches', () => {
    expect(
      isTrustedProxy('10.0.0.1', {
        trustedProxies: ['10.0.0.1'],
        trustPrivateRanges: false,
      })
    ).toBe(true);
  });

  it('trusts private ranges when enabled', () => {
    expect(
      isTrustedProxy('192.168.1.5', {
        trustedProxies: [],
        trustPrivateRanges: true,
      })
    ).toBe(true);
  });
});
