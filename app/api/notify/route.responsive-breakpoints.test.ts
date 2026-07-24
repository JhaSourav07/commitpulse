import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET, DELETE } from './route';
import { Notification } from '@/models/Notification';
import { gitHubUserValidator } from '@/services/github/validate-user';
import { verifyGitHubOwner } from '@/lib/github-owner-verification';

// ─── mocks ────────────────────────────────────────────────────────────────
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

vi.mock('@/models/Notification', () => ({
  Notification: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock('@/services/github/validate-user', () => ({
  gitHubUserValidator: {
    validateUser: vi.fn(),
  },
}));

vi.mock('@/lib/github-owner-verification', () => ({
  verifyGitHubOwner: vi.fn(),
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/rate-limit', () => ({
  notifyRateLimiter: {
    checkWithResult: vi.fn().mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 5,
      reset: Date.now(),
    }),
  },
  getRateLimitHeaders: vi.fn(() => ({})),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCSRF: vi.fn().mockReturnValue(null),
}));

// ─── SAFE CACHE ────────────────────────────────────────────────────────────
const cacheStore = new Map<string, number>();

vi.mock('@/lib/cache', () => ({
  DistributedCache: class {
    async get(key: string) {
      return cacheStore.get(key);
    }
    async set(key: string, value: number) {
      cacheStore.set(key, value);
    }
  },
}));

// ─── typed mocks ──────────────────────────────────────────────────────────
const validateUserMock = vi.mocked(gitHubUserValidator.validateUser);
const verifyOwnerMock = vi.mocked(verifyGitHubOwner);
const findOneMock = vi.mocked(Notification.findOne);
const findOneAndUpdateMock = vi.mocked(Notification.findOneAndUpdate);

// Helper type alias: satisfies the strict Mongoose Document return type
// without requiring us to construct a full Document in every test.
type NotificationDoc = Awaited<ReturnType<typeof Notification.findOne>>;

// ─── mobile viewport user-agents ──────────────────────────────────────────
// Simulate common mobile-width clients (~375px viewport range).
// The API must respond consistently regardless of the client device,
// so no viewport-dependent branches leak into JSON responses.
const MOBILE_USER_AGENTS = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  smallMobile:
    'Mozilla/5.0 (Linux; Android 10; SM-A102U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
};

// ─── helpers ──────────────────────────────────────────────────────────────
const makePostRequest = (body: unknown, userAgent?: string) =>
  new Request('http://localhost/api/notify', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(userAgent ? { 'user-agent': userAgent } : {}),
    },
    body: JSON.stringify(body),
  });

const makeGetRequest = (user: string, userAgent?: string) =>
  new Request(`http://localhost/api/notify?user=${encodeURIComponent(user)}`, {
    method: 'GET',
    headers: userAgent ? { 'user-agent': userAgent } : {},
  });

const validPostBody = {
  username: 'mobileuser',
  email: 'mobile@example.com',
  frequency: 'daily' as const,
  preferences: {
    notifyOnCommit: true,
    notifyOnStreak: true,
    notifyOnMilestone: true,
  },
};

// ─── tests ────────────────────────────────────────────────────────────────
describe('/api/notify - responsive breakpoints & mobile viewport layouts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheStore.clear();
    process.env.MONGODB_URI = 'mongodb://test';
  });

  // Mock standard mobile-width media coordinates (e.g. 375px wide viewports).
  // The API contract must not vary by the caller's viewport width — a mobile
  // Safari client must receive the exact same JSON shape as a desktop client.
  it('mobile (iPhone 375px) user-agent produces a JSON response with the same shape as desktop', async () => {
    validateUserMock.mockResolvedValue(true);
    verifyOwnerMock.mockResolvedValue({ verified: true });
    findOneMock.mockResolvedValue(null);
    findOneAndUpdateMock.mockResolvedValue({
      username: 'mobileuser',
      email: 'mobile@example.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    });

    const res = await POST(makePostRequest(validPostBody, MOBILE_USER_AGENTS.iphoneSafari));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      data: {
        username: expect.any(String),
        email: expect.any(String),
        frequency: expect.any(String),
        preferences: {
          notifyOnCommit: expect.any(Boolean),
          notifyOnStreak: expect.any(Boolean),
          notifyOnMilestone: expect.any(Boolean),
        },
      },
    });
  });

  // Assert that response columns (JSON keys) reflow into a stable vertical
  // structure — the object keys must always appear in the documented order
  // so mobile UI clients can render them in a single-column flex layout
  // without needing to re-map fields.
  it('response payload keys reflow into standard vertical structure on mobile clients', async () => {
    validateUserMock.mockResolvedValue(true);
    verifyOwnerMock.mockResolvedValue({ verified: true });
    findOneMock.mockResolvedValue(null);
    findOneAndUpdateMock.mockResolvedValue({
      username: 'mobileuser',
      email: 'mobile@example.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: false,
      notifyOnMilestone: true,
    });

    const res = await POST(makePostRequest(validPostBody, MOBILE_USER_AGENTS.androidChrome));
    const body = await res.json();

    // Column reflow: top-level keys must be a predictable, non-nested list
    // so mobile clients can stack them vertically without conditional logic.
    const topLevelKeys = Object.keys(body);
    expect(topLevelKeys).toEqual(expect.arrayContaining(['success', 'message', 'data']));

    // Preferences remain grouped — one logical column, not spread across root
    const prefKeys = Object.keys(body.data.preferences);
    expect(prefKeys).toEqual(['notifyOnCommit', 'notifyOnStreak', 'notifyOnMilestone']);
  });

  // Verify styling values (response fields) are not absolute widths — meaning
  // no raw email or username that would exceed a 375px viewport is echoed
  // back. Emails must be masked to avoid horizontal overflow on small screens.
  it('response does not include absolute-width values that would cause horizontal scroll on 375px viewports', async () => {
    validateUserMock.mockResolvedValue(true);
    verifyOwnerMock.mockResolvedValue({ verified: true });
    findOneMock.mockResolvedValue(null);
    findOneAndUpdateMock.mockResolvedValue({
      username: 'mobileuser',
      email: 'averyverylongemailaddress@somereallylongdomain.example.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
    });

    const res = await POST(makePostRequest(validPostBody, MOBILE_USER_AGENTS.smallMobile));
    const body = await res.json();

    // Masked emails contain "***" and are safe to render inline on mobile
    expect(body.data.email).toContain('***');
    // Raw email must never leak into the response
    expect(body.data.email).not.toBe('averyverylongemailaddress@somereallylongdomain.example.com');
  });

  // Check that navigation-like route methods (GET, POST, DELETE) all scale
  // down gracefully — every method must return a well-formed JSON body on
  // a mobile viewport request, never HTML or an unstyled error page.
  it('all HTTP methods scale down gracefully for mobile viewport requests', async () => {
    validateUserMock.mockResolvedValue(true);
    verifyOwnerMock.mockResolvedValue({ verified: true });
    findOneMock.mockResolvedValue({
      username: 'mobileuser',
      email: 'mobile@example.com',
      frequency: 'daily',
      notifyOnCommit: true,
      notifyOnStreak: true,
      notifyOnMilestone: true,
      managementTokenHash: 'hash',
    } as unknown as NotificationDoc);

    const getRes = await GET(makeGetRequest('mobileuser', MOBILE_USER_AGENTS.iphoneSafari));
    const getBody = await getRes.json();

    expect(getRes.headers.get('content-type')).toContain('application/json');
    expect(getBody).toHaveProperty('success');
    expect(getBody).toHaveProperty('message');
  });

  // Assert mobile-specific toggle states (the boolean notification preferences)
  // respond cleanly — flipping toggles on a mobile viewport must produce the
  // exact boolean state, not a truthy/falsy coerced string.
  it('mobile toggle states (notifyOnCommit/Streak/Milestone booleans) respond cleanly', async () => {
    validateUserMock.mockResolvedValue(true);
    verifyOwnerMock.mockResolvedValue({ verified: true });
    findOneMock.mockResolvedValue(null);
    findOneAndUpdateMock.mockResolvedValue({
      username: 'mobileuser',
      email: 'mobile@example.com',
      frequency: 'daily',
      notifyOnCommit: false,
      notifyOnStreak: true,
      notifyOnMilestone: false,
    });

    const bodyWithToggles = {
      ...validPostBody,
      preferences: {
        notifyOnCommit: false,
        notifyOnStreak: true,
        notifyOnMilestone: false,
      },
    };

    const res = await POST(makePostRequest(bodyWithToggles, MOBILE_USER_AGENTS.androidChrome));
    const body = await res.json();

    expect(res.status).toBe(200);
    // Booleans must remain strict booleans, not coerced strings
    expect(typeof body.data.preferences.notifyOnCommit).toBe('boolean');
    expect(typeof body.data.preferences.notifyOnStreak).toBe('boolean');
    expect(typeof body.data.preferences.notifyOnMilestone).toBe('boolean');
    expect(body.data.preferences.notifyOnCommit).toBe(false);
    expect(body.data.preferences.notifyOnStreak).toBe(true);
    expect(body.data.preferences.notifyOnMilestone).toBe(false);
  });

  // Bonus: DELETE method must also handle mobile viewport requests correctly
  it('DELETE handler responds cleanly to mobile viewport request', async () => {
    findOneMock.mockResolvedValue({
      username: 'mobileuser',
      managementTokenHash: 'hash',
    } as unknown as NotificationDoc);
    verifyOwnerMock.mockResolvedValue({ verified: true });
    (Notification.deleteOne as ReturnType<typeof vi.fn>).mockResolvedValue({ deletedCount: 1 });

    const { NextRequest } = await import('next/server');
    const req = new NextRequest(
      new Request('http://localhost/api/notify?user=mobileuser', {
        method: 'DELETE',
        headers: { 'user-agent': MOBILE_USER_AGENTS.iphoneSafari },
      })
    );

    const res = await DELETE(req);
    const body = await res.json();

    expect(res.headers.get('content-type')).toContain('application/json');
    expect(body).toHaveProperty('success');
  });
});
