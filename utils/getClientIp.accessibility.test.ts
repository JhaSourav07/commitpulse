import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getClientIp } from './getClientIp';

describe('getClientIp Data Accessibility & Header Resolution Tests', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. reliably accesses the leftmost client IP in an X-Forwarded-For proxy chain when proxies are universally trusted', () => {
    const request = new Request('https://commitpulse.com', {
      headers: new Headers({
        'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.0.2.1',
      }),
    });

    const ip = getClientIp(request, {
      directIp: '192.168.1.1',
      proxyConfig: { trustedProxies: ['*'], trustPrivateRanges: true },
    });

    expect(ip).toBe('203.0.113.1');
  });

  it('2. accesses secure fallback priority headers (cf-connecting-ip) when primary forwarding headers are missing', () => {
    const request = new Request('https://commitpulse.com', {
      headers: new Headers({
        'cf-connecting-ip': '198.51.100.5',
        'x-real-ip': '198.51.100.2',
      }),
    });

    const ip = getClientIp(request, {
      directIp: '192.168.1.1',
      proxyConfig: { trustedProxies: ['192.168.1.1'], trustPrivateRanges: false },
    });

    expect(ip).toBe('198.51.100.5');
  });

  it('3. identifies spoofing attempts by verifying that claimed IPs match the securely accessed resolution', () => {
    const request = new Request('https://commitpulse.com', {
      headers: new Headers({
        'x-forwarded-for': '9.9.9.9, 1.1.1.1', // 9.9.9.9 is a spoofed injected IP, 1.1.1.1 is the real client
      }),
    });

    const ip = getClientIp(request, {
      directIp: '192.168.1.1',
      proxyConfig: { trustedProxies: ['192.168.1.1'], trustPrivateRanges: false },
    });

    expect(ip).toBe('1.1.1.1');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('SPOOFED_HEADER_ATTEMPT'));
  });

  it('4. securely defaults to local loopback accessibility when no valid network headers are present', () => {
    const request = new Request('https://commitpulse.com', {
      headers: new Headers(), // Empty headers
    });

    const ip = getClientIp(request);
    expect(ip).toBe('127.0.0.1');
  });

  it('5. resolves the correct client IP by traversing backwards through explicitly trusted proxy boundaries', () => {
    const request = new Request('https://commitpulse.com', {
      headers: new Headers({
        // Client -> Untrusted -> Trusted -> Trusted
        'x-forwarded-for': '203.0.113.1, 100.0.0.1, 192.168.1.100',
      }),
    });

    const ip = getClientIp(request, {
      directIp: '192.168.1.200',
      proxyConfig: {
        trustedProxies: ['192.168.1.100', '192.168.1.200'],
        trustPrivateRanges: false,
      },
    });

    expect(ip).toBe('100.0.0.1');
  });
});
