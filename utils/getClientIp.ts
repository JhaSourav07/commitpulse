import { NextRequest } from 'next/server';
import { GetClientIpOptions } from '../types/network';
import { isTrustedProxy, loadTrustedProxyConfig } from './trustedProxy';

/**
 * Tracks recently logged wildcard events to prevent I/O flooding
 * and event-loop blocking during massive concurrent load.
 *
 * Capped at MAX_RECENT_LOGS_CACHE_SIZE entries — under sustained load with
 * many distinct IPs, unbounded Set growth and unbounded setTimeout callbacks
 * would accumulate memory proportional to unique IPs seen in a 5s window.
 * When the cap is reached the oldest half of entries are evicted eagerly
 * instead of waiting for individual 5s timers to fire.
 */
const recentLogsCache = new Set<string>();
const MAX_RECENT_LOGS_CACHE_SIZE = 1000;

/**
 * Logs security-relevant events such as spoofing attempts in a structured format.
 */
function logSecurityEvent(event: string, details: Record<string, unknown>) {
  // Simple deduplication key to stop massive test suites from freezing the runner
  const cacheKey = `${event}:${details.resolvedIp || ''}`;
  if (recentLogsCache.has(cacheKey)) return;

  // Evict the oldest half of entries when the cap is reached to prevent
  // unbounded Set growth and unbounded setTimeout accumulation under load.
  if (recentLogsCache.size >= MAX_RECENT_LOGS_CACHE_SIZE) {
    const entries = recentLogsCache.values();
    const evictCount = Math.floor(MAX_RECENT_LOGS_CACHE_SIZE / 2);
    for (let i = 0; i < evictCount; i++) {
      const next = entries.next();
      if (!next.done) recentLogsCache.delete(next.value);
    }
  }

  recentLogsCache.add(cacheKey);
  // Automatically clear the cache entry after a short window to keep memory footprint minimal
  setTimeout(() => recentLogsCache.delete(cacheKey), 5000).unref?.();

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

  const directIp = options.directIp?.trim();
  const forwardedHeaders = [
    'x-forwarded-for',
    ...(options.headersPriority || ['x-vercel-proxied-for', 'cf-connecting-ip', 'x-real-ip']),
  ];

  // Forwarded headers cannot establish their own trust boundary. Without a
  // separately supplied direct peer IP, treat them as attacker-controlled.
  if (!directIp) {
    const spoofedHeader = forwardedHeaders.find((headerName) => headers.get(headerName));
    if (spoofedHeader) {
      logSecurityEvent('UNTRUSTED_FORWARDED_HEADER_IGNORED', {
        resolvedIp: 'unknown',
        header: spoofedHeader,
      });
    }

    return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
      ? '127.0.0.1'
      : 'unknown';
  }

  // A direct, untrusted peer is the client. Never let it override its own IP.
  if (!isTrustedProxy(directIp, config)) {
    return directIp;
  }

  // 2. Process X-Forwarded-For only when the direct peer is trusted.
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const ips = xff
      .split(',')
      .map((ip: string) => ip.trim())
      .filter(Boolean);
    if (ips.length > 0) {
      // If all proxies are trusted via wildcard
      if (config.trustedProxies.includes('*')) {
        // When trusting ALL proxies via wildcard, the true client IP is the leftmost entry (ips[0])
        const clientIp = ips[0];

        logSecurityEvent('WILDCARD_TRUST_USED', {
          resolvedIp: clientIp,
          chain: ips,
          header: 'x-forwarded-for',
        });

        return clientIp;
      }

      // Traverse from right to left (most recent to oldest proxy hop)
      // The rightmost IP is the one that connected directly to our server/balancer
      let clientIp = directIp;

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

  // 3. Custom/platform headers are accepted only behind a trusted direct peer.
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

  return directIp;
}
