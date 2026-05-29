import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { middleware } from './middleware';
import { rateLimit } from './lib/rate-limit';

vi.mock('./lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({
    success: true,
    limit: 60,
    remaining: 59,
    reset: Date.now() + 60000,
  })),
}));

const requestWithHeaders = (headers: HeadersInit = {}) =>
  ({
    headers: new Headers(headers),
  }) as NextRequest;

describe('middleware IP extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the first x-forwarded-for IP', () => {
    middleware(requestWithHeaders({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }));

    expect(rateLimit).toHaveBeenCalledWith('1.2.3.4', 60, 60000);
  });

  it('falls back to x-real-ip', () => {
    middleware(requestWithHeaders({ 'x-real-ip': '5.6.7.8' }));

    expect(rateLimit).toHaveBeenCalledWith('5.6.7.8', 60, 60000);
  });

  it('falls back to 127.0.0.1', () => {
    middleware(requestWithHeaders());

    expect(rateLimit).toHaveBeenCalledWith('127.0.0.1', 60, 60000);
  });
});
