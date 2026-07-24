import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ── Module mocks (hoisted) ──────────────────────────────────────────────────
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({
  getRateLimitHeaders: vi.fn(() => ({})),
  notifyRateLimiter: {
    checkWithResult: vi
      .fn()
      .mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60000 }),
  },
}));
vi.mock('@/utils/getClientIp', () => ({ getClientIp: vi.fn().mockReturnValue('127.0.0.1') }));
vi.mock('@/lib/security/csrf', () => ({ validateCSRF: vi.fn().mockReturnValue(null) }));
export const mockCacheGet = vi.fn().mockResolvedValue(null);
export const mockCacheSet = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/cache', () => ({
  DistributedCache: vi.fn().mockImplementation(function (
    this: Record<string, ReturnType<typeof vi.fn>>
  ) {
    this.get = mockCacheGet;
    this.set = mockCacheSet;
  }),
}));

const mockVerifyAdmin = vi.fn();
vi.mock('@/lib/review-admin-auth', () => ({
  verifyReviewAdmin: (...args: unknown[]) => mockVerifyAdmin(...args),
}));

// Review model mock — created fresh per describe block via beforeEach
vi.mock('@/models/Review', () => ({
  Review: {
    find: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

// ── Imports after mocks ──────────────────────────────────────────────────────
const { GET, POST } = await import('@/app/api/reviews/route');
const { PATCH, DELETE } = await import('@/app/api/reviews/[id]/route');
const { GET: approvedGET } = await import('@/app/api/reviews/approved/route');
/* eslint-disable @typescript-eslint/no-explicit-any */
const { Review } = await import('@/models/Review');
const mockFind: any = Review.find;
const mockCount: any = Review.countDocuments;
const mockCreate: any = Review.create;
const mockFindByIdUpdate: any = Review.findByIdAndUpdate;
const mockFindByIdDelete: any = Review.findByIdAndDelete;
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Helpers ──────────────────────────────────────────────────────────────────
const mockDoc = {
  _id: 'abc123',
  name: 'Test User',
  handle: '@testuser',
  platform: 'twitter' as const,
  message: 'This is a great tool for developers everywhere!',
  accentColor: '#10b981',
  approved: false,
  createdAt: new Date('2025-01-15'),
};

function adminReq(method: string, path: string, body?: object) {
  return new NextRequest(`http://localhost:3000/api${path}`, {
    method,
    headers: { Authorization: 'Bearer test-admin-secret', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function authFail() {
  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
}

function chainQuery(result: unknown) {
  return {
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(result),
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('GET /api/reviews (admin)', () => {
  const origUri = process.env.MONGODB_URI;
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  });
  afterAll(() => {
    process.env.MONGODB_URI = origUri;
  });

  it('returns 401 when admin auth fails', async () => {
    mockVerifyAdmin.mockReturnValue(authFail());
    const res = await GET(adminReq('GET', '/reviews'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with reviews', async () => {
    mockVerifyAdmin.mockReturnValue(null);
    mockFind.mockReturnValue(chainQuery([mockDoc]));
    mockCount.mockResolvedValue(1);

    const res = await GET(adminReq('GET', '/reviews?status=pending'));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.reviews).toHaveLength(1);
    expect(data.pagination).toBeDefined();
  });

  it('returns empty array when no MONGODB_URI', async () => {
    mockVerifyAdmin.mockReturnValue(null);
    const orig = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    const data = await (await GET(adminReq('GET', '/reviews'))).json();
    expect(data.success).toBe(true);
    expect(data.reviews).toEqual([]);
    process.env.MONGODB_URI = orig;
  });

  it('returns 500 on internal server error in GET', async () => {
    mockVerifyAdmin.mockReturnValue(null);
    mockCount.mockRejectedValueOnce(new Error('Test DB Error'));
    const res = await GET(adminReq('GET', '/reviews'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/reviews', () => {
  const origUri = process.env.MONGODB_URI;
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  });
  afterAll(() => {
    process.env.MONGODB_URI = origUri;
  });

  const body = {
    name: 'Test User',
    handle: '@testuser',
    platform: 'twitter',
    message: 'This is a great tool for developers everywhere!',
    accentColor: '#10b981',
  };

  it('creates a review and returns 201', async () => {
    mockCreate.mockResolvedValue(mockDoc);
    mockCount.mockResolvedValue(0);

    const res = await POST(adminReq('POST', '/reviews', body));
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.message).toContain('reviewed by an admin');
  });

  it('returns 400 for invalid body', async () => {
    const res = await POST(adminReq('POST', '/reviews', { name: '', handle: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 503 at capacity', async () => {
    mockCount.mockResolvedValueOnce(5000);
    const res = await POST(adminReq('POST', '/reviews', body));
    expect((await res.json()).message).toContain('capacity');
  });

  it('returns 500 if MONGODB_URI is not set in production', async () => {
    const orig = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(adminReq('POST', '/reviews', body));
    expect(res.status).toBe(500);
    process.env.MONGODB_URI = orig;
    vi.unstubAllEnvs();
  });

  it('returns 200 bypassing if MONGODB_URI is not set in development', async () => {
    const orig = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    vi.stubEnv('NODE_ENV', 'development');
    const res = await POST(adminReq('POST', '/reviews', body));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('bypassed');
    process.env.MONGODB_URI = orig;
    vi.unstubAllEnvs();
  });

  it('returns 500 on internal server error', async () => {
    mockCount.mockRejectedValueOnce(new Error('Test DB Error'));
    const res = await POST(adminReq('POST', '/reviews', body));
    expect(res.status).toBe(500);
  });

  it('returns 429 if global rate limit is exceeded', async () => {
    const { notifyRateLimiter } = await import('@/lib/rate-limit');
    // @ts-expect-error mock
    notifyRateLimiter.checkWithResult.mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 60000,
    });
    const res = await POST(adminReq('POST', '/reviews', body));
    expect(res.status).toBe(429);
  });

  it('returns 400 for malformed JSON request body', async () => {
    const req = adminReq('POST', '/reviews');
    req.json = vi.fn().mockRejectedValue(new Error('malformed'));
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 429 if write cache cooldown is active', async () => {
    mockCacheGet.mockResolvedValueOnce(Date.now() - 1000); // 1 second ago
    const res = await POST(adminReq('POST', '/reviews', body));
    expect(res.status).toBe(429);
  });
});

describe('PATCH /api/reviews/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when admin auth fails', async () => {
    mockVerifyAdmin.mockReturnValue(authFail());
    const res = await PATCH(adminReq('PATCH', '/reviews/x', { approved: true }), {
      params: Promise.resolve({ id: 'x' }),
    });
    expect(res.status).toBe(401);
  });

  it('approves a review', async () => {
    mockVerifyAdmin.mockReturnValue(null);
    mockFindByIdUpdate.mockReturnValue(chainQuery({ ...mockDoc, approved: true }));

    const res = await PATCH(adminReq('PATCH', '/reviews/abc123', { approved: true }), {
      params: Promise.resolve({ id: 'abc123' }),
    });
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.review.approved).toBe(true);
  });

  it('returns 400 when approved missing', async () => {
    mockVerifyAdmin.mockReturnValue(null);
    const res = await PATCH(adminReq('PATCH', '/reviews/abc123', {}), {
      params: Promise.resolve({ id: 'abc123' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 when not found', async () => {
    mockVerifyAdmin.mockReturnValue(null);
    mockFindByIdUpdate.mockReturnValue(chainQuery(null));
    const res = await PATCH(adminReq('PATCH', '/reviews/x', { approved: true }), {
      params: Promise.resolve({ id: 'x' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 400 for malformed JSON body', async () => {
    mockVerifyAdmin.mockReturnValue(null);
    const req = adminReq('PATCH', '/reviews/abc123');
    // Force json() to throw
    req.json = vi.fn().mockRejectedValue(new Error('malformed'));
    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'abc123' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when approved is not a boolean', async () => {
    mockVerifyAdmin.mockReturnValue(null);
    const res = await PATCH(adminReq('PATCH', '/reviews/abc123', { approved: 'yes' }), {
      params: Promise.resolve({ id: 'abc123' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 500 when MONGODB_URI is not set', async () => {
    mockVerifyAdmin.mockReturnValue(null);
    const orig = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    const res = await PATCH(adminReq('PATCH', '/reviews/abc123', { approved: true }), {
      params: Promise.resolve({ id: 'abc123' }),
    });
    expect(res.status).toBe(500);
    process.env.MONGODB_URI = orig;
  });

  it('returns 500 on internal server error', async () => {
    mockVerifyAdmin.mockReturnValue(null);
    mockFindByIdUpdate.mockImplementationOnce(() => {
      throw new Error('DB error');
    });
    const res = await PATCH(adminReq('PATCH', '/reviews/abc123', { approved: true }), {
      params: Promise.resolve({ id: 'abc123' }),
    });
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/reviews/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes a review', async () => {
    mockVerifyAdmin.mockReturnValue(null);
    mockFindByIdDelete.mockReturnValue(chainQuery(mockDoc));
    const res = await DELETE(adminReq('DELETE', '/reviews/abc123'), {
      params: Promise.resolve({ id: 'abc123' }),
    });
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('returns 404 when not found', async () => {
    mockVerifyAdmin.mockReturnValue(null);
    mockFindByIdDelete.mockReturnValue(chainQuery(null));
    const res = await DELETE(adminReq('DELETE', '/reviews/x'), {
      params: Promise.resolve({ id: 'x' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 500 when MONGODB_URI is not set', async () => {
    mockVerifyAdmin.mockReturnValue(null);
    const orig = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    const res = await DELETE(adminReq('DELETE', '/reviews/abc123'), {
      params: Promise.resolve({ id: 'abc123' }),
    });
    expect(res.status).toBe(500);
    process.env.MONGODB_URI = orig;
  });

  it('returns 500 on internal server error', async () => {
    mockVerifyAdmin.mockReturnValue(null);
    mockFindByIdDelete.mockImplementationOnce(() => {
      throw new Error('DB error');
    });
    const res = await DELETE(adminReq('DELETE', '/reviews/abc123'), {
      params: Promise.resolve({ id: 'abc123' }),
    });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/reviews/approved (public)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns approved reviews', async () => {
    mockFind.mockReturnValue(chainQuery([{ ...mockDoc, approved: true }]));
    const data = await (await approvedGET()).json();
    expect(data.success).toBe(true);
    expect(data.reviews).toHaveLength(1);
    expect(data.reviews[0].approved).toBe(true);
  });

  it('returns empty array when no MONGODB_URI', async () => {
    const orig = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    const data = await (await approvedGET()).json();
    expect(data.reviews).toEqual([]);
    process.env.MONGODB_URI = orig;
  });
});
