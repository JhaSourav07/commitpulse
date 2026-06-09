import { describe, it, expect, vi, afterEach } from 'vitest';
import { isTrustedProxy, loadTrustedProxyConfig } from './trustedProxy';

describe('trustedProxy Theme Contrast', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts wildcard trusted proxy configuration', () => {
    const config = {
      trustedProxies: ['*'],
      trustPrivateRanges: false,
    };

    expect(isTrustedProxy('203.0.113.10', config)).toBe(true);
  });

  it('accepts exact trusted proxy matches', () => {
    const config = {
      trustedProxies: ['192.168.1.1'],
      trustPrivateRanges: false,
    };

    expect(isTrustedProxy('192.168.1.1', config)).toBe(true);
  });

  it('accepts trusted proxy CIDR ranges', () => {
    const config = {
      trustedProxies: ['10.0.0.0/8'],
      trustPrivateRanges: false,
    };

    expect(isTrustedProxy('10.1.2.3', config)).toBe(true);
  });

  it('trusts private IPv4 ranges when enabled', () => {
    const config = {
      trustedProxies: [],
      trustPrivateRanges: true,
    };

    expect(isTrustedProxy('192.168.0.100', config)).toBe(true);
  });

  it('loads development configuration with private ranges enabled', () => {
    vi.stubEnv('NODE_ENV', 'development');

    const config = loadTrustedProxyConfig();

    expect(config.trustPrivateRanges).toBe(true);
  });
});
