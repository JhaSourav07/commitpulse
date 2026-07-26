/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { getClientIp } from './getClientIp';

describe('getClientIp - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('1. returns fallback IP when request object is null or undefined', () => {
    expect(getClientIp(null as any)).toBe('127.0.0.1');
    expect(getClientIp(undefined as any)).toBe('127.0.0.1');
  });

  it('2. returns fallback IP when request has no headers property or headers is malformed', () => {
    expect(getClientIp({} as any)).toBe('127.0.0.1');
    expect(getClientIp({ headers: null } as any)).toBe('127.0.0.1');
    expect(getClientIp({ headers: {} } as any)).toBe('127.0.0.1');
    expect(getClientIp({ headers: { get: 'not-a-function' } } as any)).toBe('127.0.0.1');
  });

  it('3. returns fallback IP when options object is null or undefined', () => {
    const req = new Request('http://localhost:3000/api/streak');
    expect(getClientIp(req, null as any)).toBe('127.0.0.1');
    expect(getClientIp(req, undefined as any)).toBe('127.0.0.1');
  });

  it('4. behaves normally when options is empty object', () => {
    const req = new Request('http://localhost:3000/api/streak');
    expect(getClientIp(req, {})).toBe('127.0.0.1');
  });

  it('5. changes fallback behavior based on NODE_ENV (development/test vs production)', () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = 'production';
      expect(getClientIp(null as any)).toBe('unknown');
      expect(getClientIp({} as any)).toBe('unknown');
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
    }
  });

  it('6. handles malformed request and headers without throwing even if headersPriority is custom', () => {
    expect(
      getClientIp(null as any, {
        headersPriority: ['x-custom-ip'],
      })
    ).toBe('127.0.0.1');
  });
});
