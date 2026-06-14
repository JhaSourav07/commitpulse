import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

function makeRequest(ip: string, xff?: string): NextRequest {
  const headers: Record<string, string> = {
    'x-forwarded-for': xff ?? ip,
  };
  return new NextRequest('http://localhost:3000/api/streak?user=octocat', { headers });
}

describe('middleware massive-scaling: Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('processes 1000 requests from distinct IPs successfully within the rate limit', async () => {
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      const ip = `203.0.${Math.floor(i / 256)}.${i % 256}`;
      const response = await middleware(makeRequest(ip));
      expect(response.status).not.toBe(429);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(5000);
  });

  it('returns 429 with correct rate limit headers after exceeding the 60-request limit for a single IP', async () => {
    const ip = '198.51.100.10';

    let lastResponse;
    for (let i = 0; i < 61; i++) {
      lastResponse = await middleware(makeRequest(ip));
    }

    expect(lastResponse!.status).toBe(429);
    expect(lastResponse!.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(lastResponse!.headers.get('X-RateLimit-Limit')).toBe('60');

    const body = await lastResponse!.json();
    expect(body).toEqual({ error: 'Too many requests' });
  });

  it('handles 3000 distinct IPs exceeding the internal cache capacity without throwing or breaking rate limit tracking', async () => {
    for (let i = 0; i < 3000; i++) {
      const ip = `172.${16 + (i % 16)}.${Math.floor(i / 256) % 256}.${i % 256}`;
      const response = await middleware(makeRequest(ip));
      expect(response.status).not.toBe(429);
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('59');
    }
  });

  it('extracts only the first IP from an extremely long x-forwarded-for chain of 100 proxies', async () => {
    const chain = Array.from({ length: 100 }, (_, i) => `10.0.0.${i + 1}`).join(', ');
    const ip = '203.0.113.50';

    const response = await middleware(makeRequest(ip, `${ip}, ${chain}`));

    expect(response.status).not.toBe(429);
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('59');
  });

  it('correctly tracks remaining count across 60 sequential requests from the same IP', async () => {
    const ip = '198.51.100.20';
    const remainingValues: string[] = [];

    for (let i = 0; i < 60; i++) {
      const response = await middleware(makeRequest(ip));
      remainingValues.push(response.headers.get('X-RateLimit-Remaining')!);
    }

    expect(remainingValues[0]).toBe('59');
    expect(remainingValues[59]).toBe('0');
  });
});
