import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateCSRF } from './csrf';

function makeRequest(headers: Record<string, string>): Request {
  return new Request('https://commitpulse.vercel.app/api/test', {
    method: 'POST',
    headers,
  });
}

describe('validateCSRF', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://commitpulse.vercel.app';
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    }
  });

  it('allows requests with no origin and no referer (server-to-server)', () => {
    const req = new Request('https://commitpulse.vercel.app/api/test', { method: 'POST' });
    expect(validateCSRF(req)).toBeNull();
  });

  it('allows requests from the exact same origin', () => {
    const req = makeRequest({ origin: 'https://commitpulse.vercel.app' });
    expect(validateCSRF(req)).toBeNull();
  });

  it('allows requests from the same origin with referer header', () => {
    const req = makeRequest({ referer: 'https://commitpulse.vercel.app/dashboard' });
    expect(validateCSRF(req)).toBeNull();
  });

  it('rejects requests from a different port on the same hostname', () => {
    const req = makeRequest({ origin: 'https://commitpulse.vercel.app:9999' });
    const res = validateCSRF(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });

  it('rejects requests from a different hostname', () => {
    const req = makeRequest({ origin: 'https://evil.example.com' });
    const res = validateCSRF(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });

  it('rejects requests from a different protocol', () => {
    const req = makeRequest({ origin: 'http://commitpulse.vercel.app' });
    const res = validateCSRF(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });

  it('allows requests from the same origin with explicit default port in origin', () => {
    const req = makeRequest({ origin: 'https://commitpulse.vercel.app:443' });
    expect(validateCSRF(req)).toBeNull();
  });

  it('allows requests from the same origin with explicit port in allowed origin env', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://commitpulse.vercel.app:3000';
    const req = makeRequest({ origin: 'https://commitpulse.vercel.app:3000' });
    expect(validateCSRF(req)).toBeNull();
  });

  it('rejects requests from a non-default port when allowed origin uses default port', () => {
    const req = makeRequest({ origin: 'https://commitpulse.vercel.app:3000' });
    const res = validateCSRF(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });

  it('returns 403 with JSON error body on CSRF failure', () => {
    const req = makeRequest({ origin: 'https://evil.example.com:443' });
    const res = validateCSRF(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });

  it('rejects requests with malformed origin', () => {
    const req = makeRequest({ origin: 'not-a-url' });
    const res = validateCSRF(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });

  it('falls back to referer when origin is absent', () => {
    const req = makeRequest({ referer: 'https://commitpulse.vercel.app/page' });
    expect(validateCSRF(req)).toBeNull();
  });

  it('rejects referer from a different port', () => {
    const req = makeRequest({ referer: 'https://commitpulse.vercel.app:8080/page' });
    const res = validateCSRF(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });

  it('allows either origin OR referer to be valid', () => {
    const req = makeRequest({
      origin: 'https://commitpulse.vercel.app',
      referer: 'https://evil.example.com:9999/page',
    });
    expect(validateCSRF(req)).toBeNull();
  });

  it('rejects when both origin and referer are invalid', () => {
    const req = makeRequest({
      origin: 'https://evil.example.com',
      referer: 'https://evil.example.com:9999/page',
    });
    const res = validateCSRF(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });
});
