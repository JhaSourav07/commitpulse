import { TrustedProxyConfig } from '../types/network';

// Private and Loopback CIDR ranges
const PRIVATE_IPV4_RANGES = [
  '127.0.0.0/8',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '169.254.0.0/16',
];

/**
 * Converts an IPv4 address to its 32-bit integer representation.
 */
export function ip4ToInt(ip: string): number {
  return ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
}

/**
 * Checks if an IPv4 address falls within a given CIDR block.
 */
export function isIPv4InCidr(ip: string, cidr: string): boolean {
  try {
    const [range, bitsStr] = cidr.split('/');
    const bits = parseInt(bitsStr, 10);
    if (isNaN(bits) || bits < 0 || bits > 32) return false;

    const ipInt = ip4ToInt(ip);
    const rangeInt = ip4ToInt(range);

    if (bits === 0) return true;

    // Using >>> 0 to ensure unsigned 32-bit integer arithmetic
    const mask = bits === 32 ? 0xffffffff : ~((1 << (32 - bits)) - 1) >>> 0;
    return (ipInt & mask) === (rangeInt & mask);
  } catch {
    return false;
  }
}

/**
 * Check if the given string is a valid IPv4 address.
 */
export function isIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

/**
 * Checks if an IP is in the trusted proxy configuration list or private ranges.
 */
export function isTrustedProxy(ip: string, config: TrustedProxyConfig): boolean {
  const sanitizedIp = ip.trim();

  // If wildcard is used, trust all proxies
  if (config.trustedProxies.includes('*')) {
    return true;
  }

  // Check exact matches
  if (config.trustedProxies.includes(sanitizedIp)) {
    return true;
  }

  // Handle IPv4 CIDR matching
  if (isIPv4(sanitizedIp)) {
    for (const entry of config.trustedProxies) {
      if (entry.includes('/') && isIPv4InCidr(sanitizedIp, entry)) {
        return true;
      }
    }

    if (config.trustPrivateRanges) {
      for (const range of PRIVATE_IPV4_RANGES) {
        if (isIPv4InCidr(sanitizedIp, range)) {
          return true;
        }
      }
    }
  } else {
    // IPv6 checks (simple exact match loopback/private range fallback)
    if (config.trustPrivateRanges) {
      if (sanitizedIp === '::1' || sanitizedIp === '0:0:0:0:0:0:0:1') {
        return true;
      }
      // Simple prefix match for private IPv6 ranges
      const lowerIp = sanitizedIp.toLowerCase();
      if (lowerIp.startsWith('fc00') || lowerIp.startsWith('fd00') || lowerIp.startsWith('fe80')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Loads trusted proxy configuration from environment variables.
 */
export function loadTrustedProxyConfig(): TrustedProxyConfig {
  const envProxies = process.env.TRUSTED_PROXIES;
  const trustedProxies: string[] = [];

  if (envProxies) {
    trustedProxies.push(
      ...envProxies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }

  // In development, we always trust loopback IP addresses by default
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    trustedProxies,
    trustPrivateRanges: isDev || process.env.TRUST_PRIVATE_PROXIES === 'true',
  };
}
