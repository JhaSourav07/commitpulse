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

function makeRequest(body: string | Record<string, unknown>): Request {
  return new Request('http://localhost/api/student/resume/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/student/resume/confirm Extra Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MONGODB_URI;
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
    // Process.env.MONGODB_URI is undefined by default in beforeEach
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
      { upsert: true, new: true }
    );
    expect(response.status).toBe(200);
  });
});
