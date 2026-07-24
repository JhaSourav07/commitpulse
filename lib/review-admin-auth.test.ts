import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { verifyReviewAdmin } from './review-admin-auth';

describe('verifyReviewAdmin', () => {
  const origSecret = process.env.REVIEW_ADMIN_SECRET;

  beforeEach(() => {
    process.env.REVIEW_ADMIN_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.REVIEW_ADMIN_SECRET = origSecret;
  });

  it('returns 503 if REVIEW_ADMIN_SECRET is not configured', async () => {
    delete process.env.REVIEW_ADMIN_SECRET;
    const req = new Request('http://localhost/api', {
      headers: { authorization: 'Bearer test-secret' },
    });
    const res = verifyReviewAdmin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(503);
    const data = await res!.json();
    expect(data.success).toBe(false);
  });

  it('returns 401 if authorization header is missing', async () => {
    const req = new Request('http://localhost/api');
    const res = verifyReviewAdmin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('returns 401 if authorization token is invalid', async () => {
    const req = new Request('http://localhost/api', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const res = verifyReviewAdmin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('returns null if authorization is valid', () => {
    const req = new Request('http://localhost/api', {
      headers: { authorization: 'Bearer test-secret' },
    });
    const res = verifyReviewAdmin(req);
    expect(res).toBeNull();
  });
});
