import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';
import { rateLimit } from '@/lib/rate-limit';

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls NextResponse.next when rate limit succeeds', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const nextSpy = vi.spyOn(NextResponse, 'next');

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    await middleware(request);

    expect(nextSpy).toHaveBeenCalled();
  });

  it('returns 429 when rate limit fails', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = await middleware(request);

    expect(response.status).toBe(429);
  });

  it('returns too many requests error body when rate limit fails', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = await middleware(request);

    await expect(response.json()).resolves.toEqual({
      error: 'Too many requests',
    });
  });

  it('sets X-RateLimit-Limit header when rate limit succeeds', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = await middleware(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
  });

  it('sets X-RateLimit-Remaining header when rate limit succeeds', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = await middleware(request);

    expect(response.headers.get('X-RateLimit-Remaining')).toBe('59');
  });

fix/5491-rate-limit-spoofable-headers
  it('ignores spoofable x-forwarded-for header and uses platform IP', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    // Create request with platform-provided IP (simulating Vercel/Next.js environment)
    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat', {
      headers: {
        'x-forwarded-for': '1.2.3.4, 5.6.7.8',
      },
    }) as unknown as NextRequest & { ip?: string };
    (request as unknown as { ip: string }).ip = '203.0.113.10';

    await middleware(request);

    // Should use platform IP, not the spoofed x-forwarded-for header
    expect(rateLimit).toHaveBeenCalledWith('203.0.113.10', 60, 60000);
  });

  it('ignores spoofable x-real-ip header and uses platform IP', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat', {
      headers: {
        'x-real-ip': '9.9.9.9',
      },
    }) as unknown as NextRequest & { ip?: string };
    (request as unknown as { ip: string }).ip = '203.0.113.10';

    await middleware(request);

    // Should use platform IP, not the spoofed x-real-ip header
    expect(rateLimit).toHaveBeenCalledWith('203.0.113.10', 60, 60000);
  });

  it('defaults to unknown when no platform IP available', async () => {

  it('uses connection IP (request.ip) if present', async () => {
 main
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    Object.defineProperty(request, 'ip', { value: '203.0.113.10', writable: true });

    await middleware(request);

 fix/5491-rate-limit-spoofable-headers
    // Without platform IP, getClientIp returns 'unknown' in production
    // or '127.0.0.1' in development/test
    const calledIp = vi.mocked(rateLimit).mock.calls[0][0];
    expect(['unknown', '127.0.0.1']).toContain(calledIp);
  });

  it('prefers platform IP over any user-controlled headers', async () => {

    expect(rateLimit).toHaveBeenCalledWith('203.0.113.10', 60, 60000);
  });

  it('ignores spoofed X-Forwarded-For when request.ip is present', async () => {
 main
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat', {
      headers: {
        'x-forwarded-for': '1.2.3.4, 5.6.7.8',
      },
 fix/5491-rate-limit-spoofable-headers
    }) as unknown as NextRequest & { ip?: string };
    (request as unknown as { ip: string }).ip = '203.0.113.10';

    await middleware(request);

    // Should use platform IP, ignoring all spoofable headers
    expect(rateLimit).toHaveBeenCalledWith('203.0.113.10', 60, 60000);
  });

  it('prevents rate limit evasion via header rotation', async () => {

    });
    Object.defineProperty(request, 'ip', { value: '203.0.113.10', writable: true });

    await middleware(request);

    expect(rateLimit).toHaveBeenCalledWith('203.0.113.10', 60, 60000);
  });

  it('defaults to 127.0.0.1 when no request.ip and headers are untrusted/missing', async () => {
 main
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

 fix/5491-rate-limit-spoofable-headers
    // Simulate attacker rotating x-forwarded-for headers
    const request1 = new NextRequest('http://localhost:3000/api/streak?user=octocat', {
      headers: { 'x-forwarded-for': '1.1.1.1' },
    }) as unknown as NextRequest & { ip?: string };
    (request1 as unknown as { ip: string }).ip = '203.0.113.10';

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
 main

    const request2 = new NextRequest('http://localhost:3000/api/streak?user=octocat', {
      headers: { 'x-forwarded-for': '2.2.2.2' },
    }) as unknown as NextRequest & { ip?: string };
    (request2 as unknown as { ip: string }).ip = '203.0.113.10';

    await middleware(request1);
    await middleware(request2);

 fix/5491-rate-limit-spoofable-headers
    // Both requests should be tracked under the same platform IP
    expect(rateLimit).toHaveBeenNthCalledWith(1, '203.0.113.10', 60, 60000);
    expect(rateLimit).toHaveBeenNthCalledWith(2, '203.0.113.10', 60, 60000);

    expect(rateLimit).toHaveBeenCalledWith('127.0.0.1', 60, 60000);
 main
  });
});
