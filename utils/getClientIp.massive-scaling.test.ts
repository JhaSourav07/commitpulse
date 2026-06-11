import { describe, it, expect } from 'vitest';
import { getClientIp } from './getClientIp';

describe('getClientIp Massive Scaling Tests', () => {
  it('1. handles massive x-forwarded-for chains (100,000 IPs) without stack overflow or performance degradation', () => {
    const massiveIpChain = Array.from({ length: 100000 })
      .map((_, i) => `192.168.1.${i % 255}`)
      .join(',');
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': massiveIpChain,
      },
    });

    const start = performance.now();
    const result = getClientIp(request, {
      proxyConfig: { trustedProxies: ['*'], trustPrivateRanges: true },
    });
    const duration = performance.now() - start;

    expect(result).toBe('192.168.1.0');
    expect(duration).toBeLessThan(1500); // Verify fast execution times
  });

  it('2. efficiently processes large arrays of priority headers without breaking or hanging', () => {
    const hugePriorityHeaders = Array.from({ length: 10000 }).map((_, i) => `x-custom-ip-${i}`);
    const headers = new Headers();
    // Only the very last header has a value
    headers.set('x-custom-ip-9999', '10.0.0.99');

    const request = new Request('http://localhost', { headers });

    const start = performance.now();
    const result = getClientIp(request, { headersPriority: hugePriorityHeaders });
    const duration = performance.now() - start;

    expect(result).toBe('10.0.0.99');
    expect(duration).toBeLessThan(500);
  });

  it('3. maintains execution performance when thousands of spoofed IPs trigger repeated cache logging', () => {
    const start = performance.now();

    // Run 5000 identical spoofed requests to trigger the caching deduplication mechanism heavily
    for (let i = 0; i < 5000; i++) {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': `1.1.1.1, 2.2.2.2`,
          'x-real-ip': '3.3.3.3',
        },
      });
      // Force fallback spoof detection
      getClientIp(request, { proxyConfig: { trustedProxies: [], trustPrivateRanges: false } });
    }
    const duration = performance.now() - start;

    // The recentLogsCache Set should handle this cleanly without memory overflow
    expect(duration).toBeLessThan(2000);
  });

  it('4. securely parses and traverses right-to-left across extremely long chains of trusted proxy boundaries', () => {
    // 50,000 trusted proxies followed by 1 untrusted true client IP
    const chain = Array.from({ length: 50000 }).map(() => '10.0.0.1');
    chain.unshift('203.0.113.5'); // True client at the far left (index 0)

    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': chain.join(',') },
    });

    const start = performance.now();
    const result = getClientIp(request, {
      proxyConfig: { trustedProxies: ['10.0.0.1'], trustPrivateRanges: true },
    });
    const duration = performance.now() - start;

    expect(result).toBe('203.0.113.5');
    expect(duration).toBeLessThan(1500);
  });

  it('5. prevents regex or string parsing buffer overflows on malformed massive-scale inputs', () => {
    // Large malformed string with 500,000 spaces
    const malformed = '192.168.1.1' + ' '.repeat(500000) + ',10.0.0.1';
    const request = new Request('http://localhost', {
      headers: { 'cf-connecting-ip': malformed },
    });

    const start = performance.now();
    const result = getClientIp(request, { headersPriority: ['cf-connecting-ip'] });
    const duration = performance.now() - start;

    // JS String.trim() should safely handle it without freezing
    expect(result).toBe(malformed.trim());
    expect(duration).toBeLessThan(500);
  });
});
