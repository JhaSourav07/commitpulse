import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { StudentProfile } from '@/models/StudentProfile';

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

describe('POST /api/student/resume/confirm Edge Cases & Empty/Missing Inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    vi.mocked(verifyGitHubOwner).mockResolvedValue({ verified: true });
  });

  afterEach(() => {
    delete process.env.MONGODB_URI;
  });

  it('returns 200 when optional arrays are provided but empty', async () => {
    vi.mocked(StudentProfile.findOneAndUpdate).mockResolvedValueOnce({} as never);

    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          skills: [],
          education: [],
          experience: [],
        },
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    expect(StudentProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { githubUsername: 'testuser' },
      expect.objectContaining({
        $set: expect.objectContaining({
          skills: [],
          education: [],
          experience: [],
        }),
      }),
      expect.any(Object)
    );
  });

  it('returns 200 when optional fields are completely omitted', async () => {
    vi.mocked(StudentProfile.findOneAndUpdate).mockResolvedValueOnce({} as never);

    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          // Omitting skills, education, experience, phone
        },
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    expect(StudentProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { githubUsername: 'testuser' },
      expect.objectContaining({
        $set: expect.objectContaining({
          skills: [],
          education: [],
          experience: [],
          phone: '',
        }),
      }),
      expect.any(Object)
    );
  });

  it('returns 400 when required fields are empty strings', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: {
          name: '   ', // whitespace only
          email: '',
        },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Name and email are required');
    expect(StudentProfile.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 when data object is entirely empty', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: {},
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Name and email are required');
    expect(StudentProfile.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 when null is provided for arrays', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          skills: null,
          education: null,
        },
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    // Zod will return an invalid_type error because it expects an array, not null
    expect(body.error).toBeDefined();
    expect(StudentProfile.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
