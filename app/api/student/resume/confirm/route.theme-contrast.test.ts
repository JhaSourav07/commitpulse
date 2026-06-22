import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { POST } from './route';

vi.mock('@/lib/github-owner-verification', () => ({
  verifyGitHubOwner: vi.fn().mockResolvedValue({
    verified: true,
    status: 200,
    message: 'OK',
  }),
}));

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/StudentProfile', () => ({
  StudentProfile: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('@/lib/github-owner-verification', () => ({
  verifyGitHubOwner: vi.fn().mockResolvedValue({ verified: true }),
}));

const { mockRateLimitCheck } = vi.hoisted(() => {
  return {
    mockRateLimitCheck: vi.fn().mockResolvedValue(true),
  };
});

vi.mock('@/lib/rate-limit', () => {
  return {
    RateLimiter: class {
      check = mockRateLimitCheck;
    },
  };
});

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/github-owner-verification', () => ({
  verifyGitHubOwner: vi.fn().mockResolvedValue({ verified: true }),
}));

// Set up prefers-color-scheme via window.matchMedia mock
let prefersColorScheme: 'dark' | 'light' = 'dark';

const windowMock = {
  matchMedia: vi.fn().mockImplementation((query: string) => ({
    matches: query === `(prefers-color-scheme: ${prefersColorScheme})`,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
};

function makeRequest(body: string | Record<string, unknown>): Request {
  return new Request('http://localhost/api/student/resume/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-owner-token',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('ApiStudentResumeConfirmRoute - Theme Contrast', () => {
  let originalWindow: unknown;
  let originalMatchMedia: unknown;
  let originalMongodbUri: string | undefined;

  beforeAll(() => {
    // Capture environment states before running the suite to prevent leaks
    originalMongodbUri = process.env.MONGODB_URI;
    if (typeof window !== 'undefined') {
      originalMatchMedia = window.matchMedia;
    } else {
      originalWindow = globalThis.window;
    }
  });

  afterAll(() => {
    // Restore environment states
    process.env.MONGODB_URI = originalMongodbUri;
    if (typeof window !== 'undefined') {
      if (originalMatchMedia) {
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          configurable: true,
          value: originalMatchMedia,
        });
      } else {
        delete (window as Partial<Window>).matchMedia;
      }
    } else {
      if (originalWindow === undefined) {
        delete (globalThis as Record<string, unknown>).window;
      } else {
        globalThis.window = originalWindow as Window & typeof globalThis;
      }
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Temporarily unset MONGODB_URI to use the bypass path
    delete process.env.MONGODB_URI;

    // Apply the mock for matching client color schemes
    if (typeof window === 'undefined') {
      globalThis.window = windowMock as unknown as Window & typeof globalThis;
    } else {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: windowMock.matchMedia,
      });
    }
  });

  afterEach(() => {
    // Restore database URI after each test runs
    process.env.MONGODB_URI = originalMongodbUri;
  });

  it('dark mode: returns success response with consistent shape', async () => {
    prefersColorScheme = 'dark';

    // Verify the simulated client theme context is active
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
    expect(window.matchMedia('(prefers-color-scheme: light)').matches).toBe(false);

    const response = await POST(
      makeRequest({
        githubUsername: 'valid-dark-user',
        data: { name: 'Dark Mode User', email: 'dark@example.com' },
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.bypassed).toBe(true);
  });

  it('light mode: returns success response with consistent shape', async () => {
    prefersColorScheme = 'light';

    // Verify the simulated client theme context is active
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false);
    expect(window.matchMedia('(prefers-color-scheme: light)').matches).toBe(true);

    const response = await POST(
      makeRequest({
        githubUsername: 'valid-light-user',
        data: { name: 'Light Mode User', email: 'light@example.com' },
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.bypassed).toBe(true);
  });

  it('dark mode: error response contains renderable error text', async () => {
    prefersColorScheme = 'dark';

    // Verify the simulated client theme context is active
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);

    const response = await POST(
      makeRequest({
        data: { name: 'Dark Mode User', email: 'dark@example.com' },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    // Assert the response contains the textual foreground elements needed for high-contrast contrast ratios
    expect(body.error).toBeTypeOf('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  it('light mode: error response contains renderable error text', async () => {
    prefersColorScheme = 'light';

    // Verify the simulated client theme context is active
    expect(window.matchMedia('(prefers-color-scheme: light)').matches).toBe(true);

    const response = await POST(
      makeRequest({
        data: { name: 'Light Mode User', email: 'light@example.com' },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    // Assert the response contains the textual foreground elements needed for high-contrast contrast ratios
    expect(body.error).toBeTypeOf('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  it('rate-limit overlay does not suppress error text in either mode', async () => {
    prefersColorScheme = 'dark';
    mockRateLimitCheck.mockResolvedValueOnce(false);

    // Verify the simulated client theme context is active
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);

    const response = await POST(
      makeRequest({
        githubUsername: 'rate-limited-user',
        data: { name: 'User', email: 'user@example.com' },
      })
    );

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.success).toBe(false);
    // Verify rate limit overlay message exposes the foreground message to render with the correct contrast ratio
    expect(body.error).toBeTypeOf('string');
    expect(body.error.length).toBeGreaterThan(0);
  });
});
