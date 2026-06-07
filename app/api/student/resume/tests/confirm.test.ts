import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../confirm/route';
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
  class MockRateLimiter {
    check = vi.fn().mockResolvedValue(true);
  }

  return {
    RateLimiter: MockRateLimiter,
  };
});

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/student/resume/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/student/resume/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.MONGODB_URI;
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

    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid or missing githubUsername');
  });

  it('returns 400 when profile data is missing', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
      })
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid or missing profile data');
  });

  it('returns 400 when name or email is missing', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: {
          name: 'John Doe',
        },
      })
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Name and email are required');
  });

  it('updates StudentProfile successfully', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    vi.mocked(StudentProfile.findOneAndUpdate).mockResolvedValueOnce({} as never);

    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      })
    );

    const body = await response.json();

    expect(StudentProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { githubUsername: 'testuser' },
      expect.any(Object),
      { upsert: true, new: true }
    );

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 500 when database update fails', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    vi.mocked(StudentProfile.findOneAndUpdate).mockRejectedValueOnce(new Error('DB Error'));

    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      })
    );

    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to save profile data');
  });

  it('returns 400 when githubUsername has an invalid format', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'bad user!',
        data: { name: 'John Doe', email: 'john@example.com' },
      })
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid or missing githubUsername');
  });

  it('returns 400 when email format is invalid', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: { name: 'John Doe', email: 'not-an-email' },
      })
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid email address');
  });

  it('returns 400 when name exceeds the length cap', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: { name: 'a'.repeat(101), email: 'john@example.com' },
      })
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Name must be at most 100 characters');
  });

  it('returns 400 when skills exceed the array cap', async () => {
    const response = await POST(
      makeRequest({
        githubUsername: 'testuser',
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          skills: Array.from({ length: 101 }, () => 'x'),
        },
      })
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Too many skills (max 100)');
  });

  it('persists the parsed phone number, trims skills, and drops empty rows', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    vi.mocked(StudentProfile.findOneAndUpdate).mockResolvedValueOnce({} as never);

    const response = await POST(
      makeRequest({
        githubUsername: 'TestUser',
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 555 123 4567',
          skills: ['  TypeScript  ', ''],
          education: [{ institution: '', degree: '', field: '', startDate: '', endDate: '' }],
        },
      })
    );

    expect(response.status).toBe(200);

    const call = vi.mocked(StudentProfile.findOneAndUpdate).mock.calls[0];
    const setArg = call[1] as { $set: Record<string, unknown> };

    expect(call[0]).toEqual({ githubUsername: 'testuser' });
    expect(setArg.$set.phone).toBe('+1 555 123 4567');
    expect(setArg.$set.skills).toEqual(['TypeScript']);
    expect(setArg.$set.education).toEqual([]);
  });
});
