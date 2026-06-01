import { NextRequest } from 'next/server';
import { GetClientIpOptions } from '../types/network';
import { isTrustedProxy, loadTrustedProxyConfig } from './trustedProxy';

/**
 * Logs security-relevant events such as spoofing attempts in a structured format.
 */
function logSecurityEvent(event: string, details: Record<string, unknown>) {
  console.warn(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'SECURITY_EVENT',
      event,
      ...details,
    })
  );
}

/**
 * Extracts the true client IP from the request securely.
 *
 * It prevents spoofing by validating proxy trust boundaries.
 */
export function getClientIp(
  request: Request | NextRequest,
  options: GetClientIpOptions = {}
): string {
  const config = options.proxyConfig || loadTrustedProxyConfig();
  const headers = request.headers;

  // 1. NextRequest has a secure, platform-populated request.ip property on Vercel/Next.js
  const requestIp = (request as unknown as { ip?: string }).ip;
  if (request instanceof NextRequest && requestIp) {
    const rawXff = headers.get('x-forwarded-for');
    if (rawXff) {
      const firstIp = rawXff.split(',')[0].trim();
      if (firstIp && firstIp !== requestIp) {
        logSecurityEvent('SPOOFED_HEADER_ATTEMPT', {
          claimedIp: firstIp,
          resolvedIp: requestIp,
          header: 'x-forwarded-for',
        });
      }
    }
    return requestIp;
  }

  // 2. Process X-Forwarded-For securely if present
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const ips = xff
      .split(',')
      .map((ip: string) => ip.trim())
      .filter(Boolean);
    if (ips.length > 0) {
      // If we don't trust any proxies, do NOT trust X-Forwarded-For values supplied by the client
      if (config.trustedProxies.length === 0 && !config.trustPrivateRanges) {
        const fallbackIp = headers.get('x-real-ip')?.trim() || '127.0.0.1';
        if (ips[0] !== fallbackIp) {
          logSecurityEvent('SPOOFED_HEADER_ATTEMPT', {
            claimedIp: ips[0],
            resolvedIp: fallbackIp,
            header: 'x-forwarded-for',
          });
        }
        return fallbackIp;
      }

      // If all proxies are trusted via wildcard
      if (config.trustedProxies.includes('*')) {
        return ips[0];
      }

      // Traverse from right to left (most recent to oldest proxy hop)
      // The rightmost IP is the one that connected directly to our server/balancer
      let clientIp = ips[ips.length - 1];

      for (let i = ips.length - 1; i >= 0; i--) {
        const currentIp = ips[i];
        if (isTrustedProxy(currentIp, config)) {
          // If the proxy is trusted, the client IP is the one preceding it (to the left)
          if (i > 0) {
            clientIp = ips[i - 1];
          } else {
            clientIp = currentIp;
          }
        } else {
          // Found the first untrusted IP in the chain - this is our true client
          clientIp = currentIp;
          break;
        }
      }

      if (ips[0] !== clientIp) {
        logSecurityEvent('SPOOFED_HEADER_ATTEMPT', {
          claimedIp: ips[0],
          resolvedIp: clientIp,
          header: 'x-forwarded-for',
        });
      }

      return clientIp;
    }
  }

  // 3. Custom/Platform priority headers (e.g. Cloudflare, Vercel)
  const priorityHeaders = options.headersPriority || [
    'x-vercel-proxied-for',
    'cf-connecting-ip',
    'x-real-ip',
  ];

  for (const headerName of priorityHeaders) {
    const headerVal = headers.get(headerName);
    if (headerVal) {
      const trimmed = headerVal.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  // 4. Ultimate Fallback
  return '127.0.0.1';
}
