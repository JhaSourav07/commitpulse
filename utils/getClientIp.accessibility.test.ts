import { describe, test, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { getClientIp } from './getClientIp';

describe('getClientIp - Accessibility Standards & Screen Reader Aria Compliance', () => {
  test('Aria Label Compliance: resolves request.ip as the primary accessible identity source', () => {
    const req = new NextRequest('http://localhost:3000/api/test');
    Object.defineProperty(req, 'ip', {
      value: '203.0.113.10',
      writable: true,
    });

    expect(getClientIp(req)).toBe('203.0.113.10');
  });

  test('Focus Outline Behavior: ignores untrusted forwarded headers when no trusted peer exists', () => {
    const req = new Request('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '198.51.100.5',
      },
    });

    expect(getClientIp(req)).toBe('127.0.0.1');
  });

  test('Tooltip Announcement: resolves the correct client IP through a trusted proxy chain', () => {
    const req = new Request('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '198.51.100.5, 203.0.113.10, 127.0.0.1',
      },
    });

    const ip = getClientIp(req, {
      proxyConfig: {
        trustedProxies: ['127.0.0.1', '203.0.113.10'],
        trustPrivateRanges: true,
      },
      directIp: '127.0.0.1',
    });

    expect(ip).toBe('198.51.100.5');
  });

  test('Tab Ordering: wildcard trust returns the leftmost client IP in the chain', () => {
    const req = new Request('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '198.51.100.5, 203.0.113.10',
      },
    });

    const ip = getClientIp(req, {
      proxyConfig: {
        trustedProxies: ['*'],
        trustPrivateRanges: false,
      },
      directIp: '203.0.113.10',
    });

    expect(ip).toBe('198.51.100.5');
  });

  test('Heading Hierarchy: falls back to localhost in development/test environments when no IP data exists', () => {
    const req = new Request('http://localhost:3000/api/test');

    expect(getClientIp(req)).toBe('127.0.0.1');
  });
});
