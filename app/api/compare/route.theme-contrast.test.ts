import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';

vi.mock('@/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github')>();
  return {
    ...actual,
    getFullDashboardData: vi.fn(),
  };
});
vi.mock('@/lib/rate-limit', () => ({
  RateLimiter: vi.fn().mockImplementation(function () {
    return { check: vi.fn().mockResolvedValue(true) };
  }),
}));
vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn().mockResolvedValue(undefined),
}));

describe('ApiCompareRoute – Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns a payload free of hardcoded colour tokens under both dark and light media preferences', async () => {
    vi.mocked(getFullDashboardData)
      .mockResolvedValueOnce({ login: 'alice' } as never)
      .mockResolvedValueOnce({ login: 'bob' } as never);

    const originalMatchMedia = window.matchMedia;

    // Simulate dark media preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const requestDark = new Request('http://localhost/api/compare?user1=alice&user2=bob');
    const responseDark = await GET(requestDark);
    const bodyDark = await responseDark.json();
    const bodyStrDark = JSON.stringify(bodyDark);

    expect(bodyStrDark).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    expect(bodyStrDark).not.toMatch(/rgba?\(/i);
    expect(bodyStrDark).not.toMatch(
      /\b(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+\b/
    );

    // Simulate light media preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('light'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const requestLight = new Request('http://localhost/api/compare?user1=alice&user2=bob');
    const responseLight = await GET(requestLight);
    const bodyLight = await responseLight.json();
    const bodyStrLight = JSON.stringify(bodyLight);

    expect(bodyStrLight).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    expect(bodyStrLight).not.toMatch(/rgba?\(/i);
    expect(bodyStrLight).not.toMatch(
      /\b(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+\b/
    );

    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: originalMatchMedia,
      });
    } else {
      delete (window as Partial<Window>).matchMedia;
    }
  });

  it('error messages are plain text with no embedded style directives that would break contrast enforcement', async () => {
    // 404
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('User not found'));
    const res404 = await GET(new Request('http://localhost/api/compare?user1=ghost&user2=bob'));
    const body404 = await res404.json();
    expect(res404.status).toBe(404);
    expect(body404.error).not.toMatch(/\x1b\[/);
    expect(body404.error).not.toMatch(/style=/i);
    expect(body404.error).not.toMatch(/class=/i);
    expect(body404.error).not.toContain('\u200b');

    // 403
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('API limit reached'));
    const res403 = await GET(new Request('http://localhost/api/compare?user1=alice&user2=bob'));
    const body403 = await res403.json();
    expect(res403.status).toBe(403);
    expect(body403.error).not.toMatch(/\x1b\[/);
    expect(body403.error).not.toMatch(/style=/i);
    expect(body403.error).not.toContain('\u200b');

    // 504
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('Connection timeout'));
    const res504 = await GET(new Request('http://localhost/api/compare?user1=alice&user2=bob'));
    const body504 = await res504.json();
    expect(res504.status).toBe(504);
    expect(body504.error).not.toMatch(/\x1b\[/);
    expect(body504.error).not.toMatch(/style=/i);
    expect(body504.error).not.toContain('\u200b');

    // 502
    vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('Unexpected upstream error'));
    const res502 = await GET(new Request('http://localhost/api/compare?user1=alice&user2=bob'));
    const body502 = await res502.json();
    expect(res502.status).toBe(502);
    expect(body502.error).not.toMatch(/\x1b\[/);
    expect(body502.error).not.toMatch(/style=/i);
    expect(body502.error).not.toContain('\u200b');
  });

  it('does not emit any theme-prescribing custom headers that would override client stylesheet control', async () => {
    vi.mocked(getFullDashboardData)
      .mockResolvedValueOnce({ login: 'alice' } as never)
      .mockResolvedValueOnce({ login: 'bob' } as never);

    const request = new Request('http://localhost/api/compare?user1=alice&user2=bob');
    const response = await GET(request);

    expect(response.headers.get('X-Theme')).toBeNull();
    expect(response.headers.get('X-Color-Scheme')).toBeNull();
    expect(response.headers.get('X-Style')).toBeNull();

    const contentType = response.headers.get('content-type') || '';
    expect(contentType.toLowerCase()).toContain('application/json');
  });

  it('successful payload exposes complete user objects so no data fields render as empty overlay-only containers', async () => {
    const mockUser1 = {
      login: 'alice',
      name: 'Alice Smith',
      avatar_url: 'https://github.com/alice.png',
      public_repos: 10,
    };
    const mockUser2 = {
      login: 'bob',
      name: 'Bob Jones',
      avatar_url: 'https://github.com/bob.png',
      public_repos: 20,
    };

    vi.mocked(getFullDashboardData)
      .mockResolvedValueOnce(mockUser1 as never)
      .mockResolvedValueOnce(mockUser2 as never);

    const request = new Request('http://localhost/api/compare?user1=alice&user2=bob');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user1).toBeDefined();
    expect(body.user2).toBeDefined();
    expect(body.user1).not.toBeNull();
    expect(body.user2).not.toBeNull();
    expect(body.user1.login).toBe('alice');
    expect(body.user2.login).toBe('bob');
  });

  it('returns structurally identical responses regardless of the Sec-CH-Prefers-Color-Scheme client hint header', async () => {
    const mockUser1 = { login: 'alice', name: 'Alice' };
    const mockUser2 = { login: 'bob', name: 'Bob' };

    vi.mocked(getFullDashboardData)
      .mockResolvedValueOnce(mockUser1 as never)
      .mockResolvedValueOnce(mockUser2 as never);
    const requestDark = new Request('http://localhost/api/compare?user1=alice&user2=bob', {
      headers: { 'Sec-CH-Prefers-Color-Scheme': 'dark' },
    });
    const responseDark = await GET(requestDark);
    const bodyDark = await responseDark.json();

    vi.mocked(getFullDashboardData)
      .mockResolvedValueOnce(mockUser1 as never)
      .mockResolvedValueOnce(mockUser2 as never);
    const requestLight = new Request('http://localhost/api/compare?user1=alice&user2=bob', {
      headers: { 'Sec-CH-Prefers-Color-Scheme': 'light' },
    });
    const responseLight = await GET(requestLight);
    const bodyLight = await responseLight.json();

    expect(responseDark.status).toBe(200);
    expect(responseLight.status).toBe(200);
    expect(responseDark.headers.get('content-type')).toEqual(
      responseLight.headers.get('content-type')
    );
    expect(bodyDark).toEqual(bodyLight);
  });
});
