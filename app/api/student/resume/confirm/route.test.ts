import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { StudentProfile } from '@/models/StudentProfile';
import { RateLimiter } from '@/lib/rate-limit';

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/StudentProfile', () => ({
  StudentProfile: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('@/lib/rate-limit', () => {
  return {
    RateLimiter: class {
      check() {
        return Promise.resolve(true);
      }
    },
  };
});

vi.mock('@/lib/github-owner-verification', () => ({
  verifyGitHubOwner: vi.fn().mockResolvedValue({ verified: true }),
}));

import { verifyGitHubOwner } from '@/lib/github-owner-verification';

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

describe('POST /api/student/resume/confirm Extra Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MONGODB_URI;
    vi.mocked(verifyGitHubOwner).mockResolvedValue({ verified: true });
  });

  afterEach(() => {
    delete process.env.MONGODB_URI;
  });

  it('returns 429 when rate limit is exceeded', async () => {
    vi.spyOn(RateLimiter.prototype, 'check').mockResolvedValueOnce(false);

    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: { name: 'John', email: 'john@example.com' },
      })
    );

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Too many requests, please try again later.');
  });

  it('returns 400 when JSON body is malformed', async () => {
    const response = await POST(makeRequest('{"invalid-json'));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Malformed JSON request body');
  });

  it('returns 200 and bypasses database update when MONGODB_URI is not configured', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: { name: 'John Doe', email: 'john@example.com' },
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.bypassed).toBe(true);
    expect(StudentProfile.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns 401 and does not write when GitHub authentication is missing', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    vi.mocked(verifyGitHubOwner).mockResolvedValueOnce({
      verified: false,
      status: 401,
      message: 'GitHub authentication is required.',
    });

    const response = await POST(
      makeRequest({
        githubUsername: 'victim',
        data: { name: 'Attacker', email: 'attacker@example.com' },
      })
    );

    expect(response.status).toBe(401);
    expect(StudentProfile.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns 403 and does not write when the authenticated account is not the owner', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    vi.mocked(verifyGitHubOwner).mockResolvedValueOnce({
      verified: false,
      status: 403,
      message: 'The authenticated GitHub account does not own this username.',
    });

    const response = await POST(
      makeRequest({
        githubUsername: 'victim',
        data: { name: 'Attacker', email: 'attacker@example.com' },
      })
    );

    expect(response.status).toBe(403);
    expect(verifyGitHubOwner).toHaveBeenCalledWith(expect.any(Request), 'victim');
    expect(StudentProfile.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('trims and lowercases the githubUsername during update', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    vi.mocked(StudentProfile.findOneAndUpdate).mockResolvedValueOnce({} as never);

    const response = await POST(
      makeRequest({
        githubUsername: '  TestUser  ',
        data: { name: 'John Doe', email: 'john@example.com' },
      })
    );

    expect(StudentProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { githubUsername: 'testuser' },
      expect.any(Object),
      { upsert: true, new: true, runValidators: true }
    );
    expect(response.status).toBe(200);
  });
  it('returns 400 when githubUsername is missing', async () => {
    const response = await POST(
      makeRequest({
        data: { name: 'John Doe', email: 'john@example.com' },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid or missing githubUsername');
  });

  it('returns 400 when githubUsername exceeds 39 characters', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'a'.repeat(40),
        data: { name: 'John Doe', email: 'john@example.com' },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid or missing githubUsername');
  });

  it('returns 400 when profile data is missing', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid or missing profile data');
  });

  it('returns 400 when name is missing', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: {
          email: 'john@example.com',
        },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Name and email are required');
  });

  it('returns 400 when email is missing', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: {
          name: 'John Doe',
        },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Name and email are required');
  });
});
