import { describe, it, expect } from 'vitest';
import {
  createNotificationManagementToken,
  hashNotificationManagementToken,
  getNotificationManagementToken,
  verifyNotificationManagementToken,
} from './notification-management-token';

describe('notification management token empty / missing inputs', () => {
  describe('createNotificationManagementToken', () => {
    it('returns a token with the correct prefix and format', () => {
      const token = createNotificationManagementToken();
      expect(token).toMatch(/^cpn_[A-Za-z0-9\-_]+$/);
    });

    it('returns a token with at least 32 bytes of random data', () => {
      const token = createNotificationManagementToken();
      const encoded = token.replace('cpn_', '');
      expect(encoded.length).toBeGreaterThanOrEqual(43);
    });

    it('produces unique tokens on consecutive calls', () => {
      const tokens = new Set(Array.from({ length: 10 }, () => createNotificationManagementToken()));
      expect(tokens.size).toBe(10);
    });
  });

  describe('hashNotificationManagementToken', () => {
    it('returns a 64-character hex string for a valid token', () => {
      const hash = hashNotificationManagementToken('cpn_testtoken123');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('returns a deterministic hash for the same input', () => {
      const token = 'cpn_sometokenvalue';
      expect(hashNotificationManagementToken(token)).toBe(hashNotificationManagementToken(token));
    });

    it('hashes an empty string without throwing', () => {
      const hash = hashNotificationManagementToken('');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('getNotificationManagementToken', () => {
    function mockRequest(headers: Record<string, string> = {}): Request {
      return { headers: new Map(Object.entries(headers)) } as unknown as Request;
    }

    it('returns null when no token is provided anywhere', () => {
      const req = mockRequest();
      expect(getNotificationManagementToken(req)).toBeNull();
    });

    it('returns null when request has empty headers', () => {
      const req = mockRequest({});
      expect(getNotificationManagementToken(req)).toBeNull();
    });

    it('extracts token from x-notification-token header', () => {
      const req = mockRequest({ 'x-notification-token': 'header-token-abc' });
      expect(getNotificationManagementToken(req)).toBe('header-token-abc');
    });

    it('extracts token from body managementToken', () => {
      const req = mockRequest();
      const body = { managementToken: 'body-token-xyz' };
      expect(getNotificationManagementToken(req, body)).toBe('body-token-xyz');
    });

    it('extracts token from search params managementToken', () => {
      const req = mockRequest();
      const params = new URLSearchParams({ managementToken: 'query-token-123' });
      expect(getNotificationManagementToken(req, undefined, params)).toBe('query-token-123');
    });

    it('extracts token from search params token fallback', () => {
      const req = mockRequest();
      const params = new URLSearchParams({ token: 'fallback-token-456' });
      expect(getNotificationManagementToken(req, undefined, params)).toBe('fallback-token-456');
    });

    it('prefers header over body when both are present', () => {
      const req = mockRequest({ 'x-notification-token': 'header-value' });
      const body = { managementToken: 'body-value' };
      expect(getNotificationManagementToken(req, body)).toBe('header-value');
    });

    it('prefers body over query params when both are present', () => {
      const req = mockRequest();
      const body = { managementToken: 'body-value' };
      const params = new URLSearchParams({ managementToken: 'query-value' });
      expect(getNotificationManagementToken(req, body, params)).toBe('body-value');
    });

    it('ignores body managementToken when it is not a string', () => {
      const req = mockRequest();
      const body = { managementToken: 12345 };
      expect(getNotificationManagementToken(req, body)).toBeNull();
    });

    it('ignores body managementToken when it is an empty string', () => {
      const req = mockRequest();
      const body = { managementToken: '' };
      expect(getNotificationManagementToken(req, body)).toBeNull();
    });

    it('ignores body managementToken when it is whitespace only', () => {
      const req = mockRequest();
      const body = { managementToken: '   ' };
      expect(getNotificationManagementToken(req, body)).toBeNull();
    });

    it('trims whitespace from header value', () => {
      const req = mockRequest({ 'x-notification-token': '  spaced-token  ' });
      expect(getNotificationManagementToken(req)).toBe('spaced-token');
    });

    it('returns null when body is provided but managementToken is missing', () => {
      const req = mockRequest();
      const body = { otherField: 'value' } as unknown as { managementToken?: unknown };
      expect(getNotificationManagementToken(req, body)).toBeNull();
    });
  });

  describe('verifyNotificationManagementToken', () => {
    it('returns false when providedToken is null', () => {
      expect(verifyNotificationManagementToken(null)).toBe(false);
    });

    it('returns false when providedToken is empty string', () => {
      expect(verifyNotificationManagementToken('')).toBe(false);
    });

    it('returns false when storedHash is null or undefined', () => {
      const token = createNotificationManagementToken();
      expect(verifyNotificationManagementToken(token, null)).toBe(false);
      expect(verifyNotificationManagementToken(token, undefined)).toBe(false);
    });

    it('returns false when storedHash is empty string', () => {
      const token = createNotificationManagementToken();
      expect(verifyNotificationManagementToken(token, '')).toBe(false);
    });

    it('returns false when storedHash is not a valid 64-char hex string', () => {
      const token = createNotificationManagementToken();
      expect(verifyNotificationManagementToken(token, 'not-hex')).toBe(false);
      expect(verifyNotificationManagementToken(token, 'zz' + '0'.repeat(62))).toBe(false);
      expect(verifyNotificationManagementToken(token, '0'.repeat(63))).toBe(false);
      expect(verifyNotificationManagementToken(token, '0'.repeat(65))).toBe(false);
    });

    it('returns true for a valid round-trip token verification', () => {
      const token = createNotificationManagementToken();
      const hash = hashNotificationManagementToken(token);
      expect(verifyNotificationManagementToken(token, hash)).toBe(true);
    });

    it('returns false for a mismatched token', () => {
      const token1 = createNotificationManagementToken();
      const token2 = createNotificationManagementToken();
      const hash1 = hashNotificationManagementToken(token1);
      expect(verifyNotificationManagementToken(token2, hash1)).toBe(false);
    });
  });
});
