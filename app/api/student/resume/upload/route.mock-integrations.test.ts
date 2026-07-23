import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { RateLimiter } from '@/lib/rate-limit';
import { parseResume, hasValidFileSignature } from '@/lib/resume-parser';

// 1. Mock the External Modules and Service Layers
vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

// ESLINT FIX: Use vi.fn() to safely build the class prototype without 'any'
vi.mock('@/lib/rate-limit', () => {
  const RateLimiterMock = vi.fn();
  RateLimiterMock.prototype.checkWithResult = vi.fn().mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: 0,
  });

  return {
    RateLimiter: RateLimiterMock,
    getRateLimitHeaders: vi.fn().mockReturnValue({}),
  };
});

vi.mock('@/lib/resume-parser', () => ({
  parseResume: vi.fn(),
  hasValidFileSignature: vi.fn().mockReturnValue(true),
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  MAX_FILE_SIZE: 5 * 1024 * 1024,
}));

describe('API Route: Student Resume Upload (Mock Integrations)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (
    fileName = 'resume.pdf',
    fileType = 'application/pdf',
    fieldName = 'resume'
  ) => {
    const formData = new FormData();
    const file = new File(['dummy pdf buffer content'], fileName, { type: fileType });
    if (fieldName) formData.append(fieldName, file);

    const req = new Request('http://localhost/api/student/resume/upload', {
      method: 'POST',
    });

    req.formData = vi.fn().mockResolvedValue(formData) as unknown as () => Promise<FormData>;

    return req;
  };

  it('1. should test service loading paths to ensure successful parsing returns 200 (mock success)', async () => {
    const mockParsedData = {
      name: 'Priyanuj',
      email: 'test@example.com',
      phone: '1234567890',
      skills: ['React', 'Next.js'],
      education: [],
      experience: [],
    };
    vi.mocked(parseResume).mockResolvedValueOnce(mockParsedData);

    const req = createMockRequest();
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockParsedData);
    expect(parseResume).toHaveBeenCalledTimes(1);
  });

  it('2. should assert local cache layers (RateLimiter) block requests before triggering async services', async () => {
    // ESLINT FIX: We provide all required properties without 'any'
    vi.mocked(RateLimiter.prototype.checkWithResult).mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 0,
    });

    const req = createMockRequest();
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error).toMatch(/Too many requests/i);
    expect(parseResume).not.toHaveBeenCalled();
  });

  it('3. should verify correct fallback procedures during fake endpoint/parsing errors', async () => {
    vi.mocked(parseResume).mockRejectedValueOnce(new Error('Parser timeout'));

    const req = createMockRequest();
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/Failed to parse resume/i);
  });

  it('4. should block invalid file signatures without hitting the parser service', async () => {
    vi.mocked(hasValidFileSignature).mockReturnValueOnce(false);

    const req = createMockRequest();
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/File content does not match its type/i);
    expect(parseResume).not.toHaveBeenCalled();
  });

  it('5. should reject requests with missing formData fields without processing', async () => {
    const req = createMockRequest('test.pdf', 'application/pdf', 'wrong_field_name');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/No resume file provided/i);
    expect(RateLimiter.prototype.checkWithResult).toHaveBeenCalled();
    expect(parseResume).not.toHaveBeenCalled();
  });
});

// 1. Mock the External Modules and Service Layers
vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/rate-limit', () => {
  const RateLimiterMock = vi.fn();
  RateLimiterMock.prototype.check = vi.fn().mockResolvedValue(true);
  RateLimiterMock.prototype.checkWithResult = vi
    .fn()
    .mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 });
  return {
    RateLimiter: RateLimiterMock,
    getRateLimitHeaders: vi.fn().mockReturnValue(new Headers()),
  };
});

vi.mock('@/lib/resume-parser', () => ({
  parseResume: vi.fn(),
  hasValidFileSignature: vi.fn().mockReturnValue(true),
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
}));

describe('API Route: Student Resume Upload (Mock Integrations)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // THE FIX: Explicitly mock formData() to bypass Vitest parsing issues
  const createMockRequest = (
    fileName = 'resume.pdf',
    fileType = 'application/pdf',
    fieldName = 'resume'
  ) => {
    const formData = new FormData();
    const file = new File(['dummy pdf buffer content'], fileName, { type: fileType });
    if (fieldName) formData.append(fieldName, file);

    const req = new Request('http://localhost/api/student/resume/upload', {
      method: 'POST',
      // We don't attach the body here to avoid parsing crashes
    });

    // We force the request to resolve our formData object when asked
    req.formData = vi.fn().mockResolvedValue(formData) as unknown as () => Promise<FormData>;

    return req;
  };

  it('1. should test service loading paths to ensure successful parsing returns 200 (mock success)', async () => {
    // Arrange: Mock the async service to succeed
    const mockParsedData = {
      name: 'Priyanuj',
      email: 'test@example.com',
      phone: '1234567890',
      skills: ['React', 'Next.js'],
      education: [],
      experience: [],
    };
    vi.mocked(parseResume).mockResolvedValueOnce(mockParsedData);

    const req = createMockRequest();

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockParsedData);
    expect(parseResume).toHaveBeenCalledTimes(1);
  });

  it('2. should assert local cache layers (RateLimiter) block requests before triggering async services', async () => {
    // Arrange: Mock the RateLimiter cache to block the user
    vi.mocked(RateLimiter.prototype.checkWithResult).mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 0,
    });

    const req = createMockRequest();

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert: Blocked with 429, and parseResume is NEVER called
    expect(res.status).toBe(429);
    expect(json.error).toMatch(/Too many requests/i);
    expect(parseResume).not.toHaveBeenCalled();
  });

  it('3. should verify correct fallback procedures during fake endpoint/parsing errors', async () => {
    // Arrange: Simulate the PDF parser crashing or timing out
    vi.mocked(parseResume).mockRejectedValueOnce(new Error('Parser timeout'));

    const req = createMockRequest();

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert: Route catches the error safely and returns 422
    expect(res.status).toBe(422);
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/Failed to parse resume/i);
  });

  it('4. should block invalid file signatures without hitting the parser service', async () => {
    // Arrange: Simulate a user renaming a .exe file to .pdf
    vi.mocked(hasValidFileSignature).mockReturnValueOnce(false);

    const req = createMockRequest();

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert: Fails security check (400) before reaching the async parser
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/File content does not match its type/i);
    expect(parseResume).not.toHaveBeenCalled();
  });

  it('5. should reject requests with missing formData fields without processing', async () => {
    // Arrange: Send a request where the file is named 'wrong_field' instead of 'resume'
    const req = createMockRequest('test.pdf', 'application/pdf', 'wrong_field_name');

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert: Immediately fails validation (400)
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/No resume file provided/i);
    expect(RateLimiter.prototype.checkWithResult).toHaveBeenCalled();
    expect(parseResume).not.toHaveBeenCalled();
  });
});
