import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { verifyGitHubOwner } from '@/lib/github-owner-verification';

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/StudentProfile', () => ({
  StudentProfile: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/github-owner-verification', () => ({
  verifyGitHubOwner: vi.fn().mockResolvedValue({
    verified: true,
    status: 200,
    message: 'OK',
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  RateLimiter: class {
    async check() {
      return true;
    }
    async checkWithResult() {
      return { success: true, limit: 5, remaining: 4, reset: Date.now() + 60000 };
    }
  },
  getRateLimitHeaders: vi.fn(() => ({
    'X-RateLimit-Limit': '5',
    'X-RateLimit-Remaining': '4',
    'X-RateLimit-Reset': Date.now().toString(),
  })),
}));

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

describe('ApiStudentResumeConfirmRoute Mouse Interactivity', () => {
  let originalMongodbUri: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();

    originalMongodbUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
  });

  afterEach(() => {
    process.env.MONGODB_URI = originalMongodbUri;
  });

  it('returns 400 when request body is malformed', async () => {
    const response = await POST(makeRequest('{'));

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body.error).toBe('Malformed JSON request body');
  });

  it('returns 400 when githubUsername is missing', async () => {
    const response = await POST(
      makeRequest({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      })
    );

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body.error).toContain('githubUsername');
  });

  it('returns 400 when profile data is missing', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'octocat',
      })
    );

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body.error).toContain('profile data');
  });

  it('returns ownership verification errors from GitHub owner verification', async () => {
    vi.mocked(verifyGitHubOwner).mockResolvedValueOnce({
      verified: false,
      status: 403,
      message: 'Verification failed',
    });

    const response = await POST(
      makeRequest({
        githubUsername: 'octocat',
        data: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      })
    );

    expect(response.status).toBe(403);

    const body = await response.json();

    expect(body.error).toBe('Verification failed');
  });

  it('returns bypass response when MONGODB_URI is not configured', async () => {
    delete process.env.MONGODB_URI;

    const response = await POST(
      makeRequest({
        githubUsername: 'octocat',
        data: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      })
    );

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.bypassed).toBe(true);
  });
});
