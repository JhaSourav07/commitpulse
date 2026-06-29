import { TrustedProxyConfig } from '../types/network';

const PRIVATE_IPV4_RANGES = [
  '127.0.0.0/8',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '169.254.0.0/16',
];

// Pre-parsed CIDR entry with cached mask and range integer
interface ParsedCidr {
  rangeInt: number;
  mask: number;
}

// Pre-processed config split by entry type for O(1) and O(m) lookups
interface ParsedProxyConfig {
  wildcard: boolean;
  exactSet: Set<string>;
  cidrList: ParsedCidr[];
  cidr6List: ParsedCidr6[];
  trustPrivateRanges: boolean;
}

// Cached parsed private ranges — computed once at module load
const PARSED_PRIVATE_RANGES: ParsedCidr[] = PRIVATE_IPV4_RANGES.map(parseCidr).filter(
  Boolean
) as ParsedCidr[];

// Module-level memoization cache for loadTrustedProxyConfig
let cachedConfig: TrustedProxyConfig | null = null;
let cachedEnvKey: string | null = null;

/**
 * Converts an IPv4 address to its 32-bit integer representation.
 */
export function ip4ToInt(ip: string): number {
  return ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
}

/**
 * Parses a CIDR string into a cached mask and range integer.
 */
function parseCidr(cidr: string): ParsedCidr | null {
  try {
    const [range, bitsStr] = cidr.split('/');
    const bits = parseInt(bitsStr, 10);
    if (isNaN(bits) || bits < 0 || bits > 32) return null;
    const rangeInt = ip4ToInt(range);
    const mask = bits === 0 ? 0 : bits === 32 ? 0xffffffff : ~((1 << (32 - bits)) - 1) >>> 0;
    return { rangeInt, mask };
  } catch {
    return null;
  }
}

export interface ParsedCidr6 {
  rangeBigInt: bigint;
  mask: bigint;
}

/**
 * Converts an IPv6 address to its 128-bit BigInt representation.
 */
export function ip6ToBigInt(ip: string): bigint | null {
  const cleanIp = ip.split('/')[0].trim();
  if (!cleanIp.includes(':')) return null;

  let parts = cleanIp.split(':');

  const emptyIndex = parts.indexOf('');
  if (emptyIndex !== -1) {
    const validBlocks = parts.filter((p) => p.length > 0);
    const missing = 8 - validBlocks.length;

    const expanded: string[] = [];
    let expandedZeroes = false;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === '') {
        if (!expandedZeroes) {
          for (let j = 0; j < missing; j++) expanded.push('0');
          expandedZeroes = true;
        }
      } else {
        expanded.push(parts[i]);
      }
    }
    parts = expanded;
  }

  if (parts.length !== 8) return null;

  let intValue = BigInt(0);
  for (const part of parts) {
    const num = parseInt(part, 16);
    if (isNaN(num) || num < 0 || num > 0xffff) return null;
    intValue = (intValue << BigInt(16)) + BigInt(num);
  }

  return intValue;
}

/**
 * Parses an IPv6 CIDR string into a cached mask and range BigInt.
 */
export function parseCidr6(cidr: string): ParsedCidr6 | null {
  try {
    const [range, bitsStr] = cidr.split('/');
    if (!bitsStr) return null;
    const bits = parseInt(bitsStr, 10);
    if (isNaN(bits) || bits < 0 || bits > 128) return null;
    const rangeBigInt = ip6ToBigInt(range);
    if (rangeBigInt === null) return null;

    const shift = BigInt(128 - bits);
    const mask = bits === 0 ? BigInt(0) : ((BigInt(1) << BigInt(bits)) - BigInt(1)) << shift;

    return { rangeBigInt, mask };
  } catch {
    return null;
  }
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
 * Pre-processes a TrustedProxyConfig into a ParsedProxyConfig
 * separating wildcards, exact IPs, and CIDR ranges for faster lookup.
 */
const parsedProxyConfigCache = new WeakMap<TrustedProxyConfig, ParsedProxyConfig>();
export function buildProxyConfig(config: TrustedProxyConfig): ParsedProxyConfig {
  const exactSet = new Set<string>();
  const cidrList: ParsedCidr[] = [];
  const cidr6List: ParsedCidr6[] = [];
  let wildcard = false;

  for (const entry of config.trustedProxies) {
    if (entry === '*') {
      wildcard = true;
    } else if (entry.includes('/')) {
      if (entry.includes(':')) {
        const parsed = parseCidr6(entry);
        if (parsed) cidr6List.push(parsed);
      } else {
        const parsed = parseCidr(entry);
        if (parsed) cidrList.push(parsed);
      }
    } else {
      exactSet.add(entry.trim());
    }
  }

  return {
    wildcard,
    exactSet,
    cidrList,
    cidr6List,
    trustPrivateRanges: config.trustPrivateRanges ?? false,
  };
}

/**
 * Checks if an IP is in the trusted proxy configuration list or private ranges.
 * Accepts raw TrustedProxyConfig — builds parsed config internally for performance.
 */
export function isTrustedProxy(ip: string, config: TrustedProxyConfig): boolean {
  const sanitizedIp = ip.trim();
  let parsed = parsedProxyConfigCache.get(config);

  if (!parsed) {
    parsed = buildProxyConfig(config);
    parsedProxyConfigCache.set(config, parsed);
  }

  if (parsed.wildcard) return true;
  if (parsed.exactSet.has(sanitizedIp)) return true;

  if (isIPv4(sanitizedIp)) {
    const ipInt = ip4ToInt(sanitizedIp);

    for (const { rangeInt, mask } of parsed.cidrList) {
      if (mask === 0 || (ipInt & mask) === (rangeInt & mask)) return true;
    }

    if (parsed.trustPrivateRanges) {
      for (const { rangeInt, mask } of PARSED_PRIVATE_RANGES) {
        if (mask === 0 || (ipInt & mask) === (rangeInt & mask)) return true;
      }
    }
  } else {
    const ipBigInt = ip6ToBigInt(sanitizedIp);
    if (ipBigInt !== null) {
      for (const { rangeBigInt, mask } of parsed.cidr6List) {
        if (mask === BigInt(0) || (ipBigInt & mask) === (rangeBigInt & mask)) return true;
      }
    }

    if (parsed.trustPrivateRanges) {
      if (sanitizedIp === '::1' || sanitizedIp === '0:0:0:0:0:0:0:1') return true;
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
 * Memoized — re-parses only when env vars change.
 *
 * TRUSTED_PROXIES is optional. When running on Vercel (VERCEL=1 is always set),
 * the network layer is automatically trusted — Vercel controls the load balancer
 * that appends the true client IP to x-forwarded-for, so it cannot be spoofed.
 */
export function loadTrustedProxyConfig(): TrustedProxyConfig {
  const envProxies = process.env.TRUSTED_PROXIES ?? '';
  const vercelEnv = process.env.VERCEL ?? '';
  const envKey = `${envProxies}|${process.env.NODE_ENV}|${process.env.TRUST_PRIVATE_PROXIES}|${vercelEnv}`;

  if (cachedConfig && cachedEnvKey === envKey) {
    return cachedConfig;
  }

  const trustedProxies: string[] = [];
  if (envProxies) {
    trustedProxies.push(
      ...envProxies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }

  // Auto-trust Vercel's network layer when no explicit TRUSTED_PROXIES are configured.
  // Vercel (VERCEL=1) controls the load balancer that appends the real client IP to
  // x-forwarded-for, so the header value cannot be spoofed by end users.
  if (vercelEnv && !trustedProxies.length) {
    trustedProxies.push('*');
  }

  const isDev = process.env.NODE_ENV !== 'production';
  cachedConfig = {
    trustedProxies,
    trustPrivateRanges: isDev || process.env.TRUST_PRIVATE_PROXIES === 'true',
  };
  cachedEnvKey = envKey;
  return cachedConfig;
}
