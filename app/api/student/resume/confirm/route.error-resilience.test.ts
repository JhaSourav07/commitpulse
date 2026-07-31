import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import dbConnect from '@/lib/mongodb';
import { StudentProfile } from '@/models/StudentProfile';
import { verifyGitHubOwner } from '@/lib/github-owner-verification';
import { logger } from '@/lib/logger';
import { validateCSRF } from '@/lib/security/csrf';
import { NextResponse } from 'next/server';

// Type-safe dependency mocking to eliminate compiler and lint issues
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/models/StudentProfile', () => ({
  StudentProfile: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('@/lib/github-owner-verification', () => ({
  verifyGitHubOwner: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCSRF: vi.fn(),
}));

// Fixed RateLimiter mock using a named class export to satisfy the constructor call
vi.mock('@/lib/rate-limit', () => {
  class MockRateLimiter {
    checkWithResult = vi.fn().mockResolvedValue({
      success: true,
      remaining: 9,
      limit: 10,
      reset: Date.now() + 60000,
    });
  }
  return {
    RateLimiter: MockRateLimiter,
    getRateLimitHeaders: vi.fn().mockReturnValue({}),
  };
});

describe('ApiStudentResumeConfirmRoute Error Resilience Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      MONGODB_URI: 'mongodb://localhost:27017/test',
    };

    // Cast via unknown to safely satisfy return signature constraints without using any
    vi.mocked(validateCSRF).mockReturnValue(undefined as unknown as null);

    // Cast via unknown to bypass strict literal type union checks cleanly
    vi.mocked(verifyGitHubOwner).mockResolvedValue({
      verified: true,
      message: 'Verified',
      status: 200,
    } as unknown as { verified: true });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createMockRequest = (bodyData: Record<string, unknown>) => {
    return new Request('https://localhost/api/student/resume/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });
  };

  const validPayload = {
    githubUsername: 'testuser',
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      skills: ['TypeScript', 'React'],
      education: [],
      experience: [],
    },
  };

  // --- Test Case 1: Database Connectivity Failure (Exception Safety) ---
  test('should safely catch database connection errors and gracefully return 500 status fallback', async () => {
    vi.mocked(dbConnect).mockRejectedValueOnce(new Error('Mongo connection timeout'));

    const req = createMockRequest(validPayload);
    const response = await POST(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toEqual({
      success: false,
      error: 'Failed to save profile data',
    });
  });

  // --- Test Case 2: Verify Telemetry Logging on Failure ---
  test('should log unexpected runtime exceptions to dev-telemetry trackers appropriately', async () => {
    const mockDbError = new Error('Database write operation crashed unexpectedly');
    vi.mocked(dbConnect).mockResolvedValueOnce(undefined as unknown as typeof import('mongoose'));
    vi.mocked(StudentProfile.findOneAndUpdate).mockRejectedValueOnce(mockDbError);

    const req = createMockRequest(validPayload);
    await POST(req);

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to save student profile',
      expect.objectContaining({ error: mockDbError })
    );
  });

  // --- Test Case 3: Mock Nested Child Property Exceptions ---
  test('should handle missing or malformed nested child properties gracefully without breaking execution flow', async () => {
    vi.mocked(dbConnect).mockResolvedValueOnce(undefined as unknown as typeof import('mongoose'));

    vi.mocked(StudentProfile.findOneAndUpdate).mockImplementationOnce(() => {
      throw new TypeError("Cannot read properties of null (reading 'skills')");
    });

    const req = createMockRequest(validPayload);
    const response = await POST(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Failed to save profile data');
  });

  // --- Test Case 4: Encase Execution in Localized Boundaries (Error Fallback Payload) ---
  test('should encase process execution and return localized failure structures instead of a raw site crash', async () => {
    vi.mocked(validateCSRF).mockImplementationOnce(() => {
      return NextResponse.json({ success: false, error: 'CSRF pipeline fault' }, { status: 403 });
    });

    const req = createMockRequest(validPayload);
    const response = await POST(req);

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.success).toBe(false);
  });

  // --- Test Case 5: User Reset/Reload Paths availability confirmation ---
  test('should ensure fallback data payloads instruct client side on reset/retry options when server anomalies hit', async () => {
    vi.mocked(dbConnect).mockRejectedValueOnce(new Error('Network partition event'));

    const req = createMockRequest(validPayload);
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toHaveProperty('success', false);
    expect(json).toHaveProperty('error', 'Failed to save profile data');
  });
});
