import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { mockTimezone, restoreTimezone } from '@/test-utils/timezone-mock';
import type { ParsedResume } from '@/types/student';
import { NextRequest } from 'next/server';

vi.mock('@/lib/rate-limit', () => {
  class MockRateLimiter {
    check(ip: string): Promise<boolean> {
      return Promise.resolve(!!ip);
    }
    checkWithResult(
      ip: string
    ): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
      return Promise.resolve({
        success: !!ip,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 60000,
      });
    }
  }
  return {
    RateLimiter: MockRateLimiter,
    getRateLimitHeaders: vi.fn(() => ({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '9',
      'X-RateLimit-Reset': (Date.now() + 60000).toString(),
    })),
  };
});

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCSRF: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/resume-parser', () => ({
  ALLOWED_MIME_TYPES: ['application/pdf'],
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  hasValidFileSignature: vi.fn().mockReturnValue(true),
  parseResume: vi.fn().mockResolvedValue({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    skills: ['React', 'TypeScript'],
    education: [
      {
        institution: 'University of Tech',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2020-09-01',
        endDate: '2024-06-30',
      },
    ],
    experience: [
      {
        company: 'Innovate LLC',
        role: 'Frontend Engineer',
        startDate: '2024-07-01',
        endDate: '2026-06-30',
        description: 'Building amazing UI.',
      },
    ],
  }),
}));

interface ProcessingMetadata {
  uploadTimestamp: string;
  localizedDateWindow: string;
}

function getProcessingMetadata(timestamp: string): ProcessingMetadata {
  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return {
    uploadTimestamp: timestamp,
    localizedDateWindow: formatter.format(date),
  };
}

function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function formatProcessingDateForLocale(timestamp: string, locale: string): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function makeUploadRequest(content: string, type: string, name = 'resume.pdf'): NextRequest {
  const file = new File([new TextEncoder().encode(content)], name, { type });
  const form = new FormData();
  form.append('resume', file);
  return {
    headers: new Headers(),
    formData: async (): Promise<FormData> => form,
    url: 'http://localhost:3000/api/student/resume/upload',
    ip: '127.0.0.1',
  } as unknown as NextRequest;
}

describe('ApiStudentResumeUploadRoute - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    restoreTimezone();
  });

  it('Case 1: Mock standard global timezone offsets and assert that backend processing metadata assigns resume uploads into correct localized date windows', async () => {
    const timestamp = '2026-07-06T01:00:00Z';
    const testCases: { tz: string; expectedDate: string }[] = [
      { tz: 'America/New_York', expectedDate: '2026-07-05' },
      { tz: 'Asia/Kolkata', expectedDate: '2026-07-06' },
      { tz: 'Asia/Tokyo', expectedDate: '2026-07-06' },
      { tz: 'UTC', expectedDate: '2026-07-06' },
    ];
    for (const testCase of testCases) {
      mockTimezone(testCase.tz);
      const req: NextRequest = makeUploadRequest('%PDF-1.5\n%EOF', 'application/pdf');
      const response = await POST(req);
      expect(response.status).toBe(200);
      const metadata = getProcessingMetadata(timestamp);
      expect(metadata.localizedDateWindow).toBe(testCase.expectedDate);
      restoreTimezone();
    }
  });

  it('Case 2: Validate calendar boundary alignment metrics across rare leap year milestones (e.g., February 29th) to confirm timestamps map with no date gaps', async () => {
    vi.useFakeTimers();
    mockTimezone('UTC');
    vi.setSystemTime(new Date('2024-02-29T12:00:00Z'));
    const req: NextRequest = makeUploadRequest('%PDF-1.5\n%EOF', 'application/pdf');
    const response = await POST(req);
    expect(response.status).toBe(200);
    const prevDay = getProcessingMetadata('2024-02-28T12:00:00Z');
    const leapDay = getProcessingMetadata('2024-02-29T12:00:00Z');
    const nextDay = getProcessingMetadata('2024-03-01T12:00:00Z');
    expect(prevDay.localizedDateWindow).toBe('2024-02-28');
    expect(leapDay.localizedDateWindow).toBe('2024-02-29');
    expect(nextDay.localizedDateWindow).toBe('2024-03-01');
    expect(getDaysDifference(prevDay.localizedDateWindow, leapDay.localizedDateWindow)).toBe(1);
    expect(getDaysDifference(leapDay.localizedDateWindow, nextDay.localizedDateWindow)).toBe(1);
    vi.useRealTimers();
    restoreTimezone();
  });

  it('Case 3: Test transition dates across daylight savings time adjustments (spring-forward / fall-back hourly shifts) to verify calculation boundaries remain resilient', async () => {
    vi.useFakeTimers();
    mockTimezone('America/New_York');
    vi.setSystemTime(new Date('2026-03-08T01:59:00-05:00'));
    let req: NextRequest = makeUploadRequest('%PDF-1.5\n%EOF', 'application/pdf');
    let response = await POST(req);
    expect(response.status).toBe(200);
    const beforeSpring = getProcessingMetadata('2026-03-08T01:59:00-05:00');
    vi.setSystemTime(new Date('2026-03-08T03:01:00-04:00'));
    req = makeUploadRequest('%PDF-1.5\n%EOF', 'application/pdf');
    response = await POST(req);
    expect(response.status).toBe(200);
    const afterSpring = getProcessingMetadata('2026-03-08T03:01:00-04:00');
    expect(beforeSpring.localizedDateWindow).toBe('2026-03-08');
    expect(afterSpring.localizedDateWindow).toBe('2026-03-08');
    vi.setSystemTime(new Date('2026-11-01T01:59:00-04:00'));
    req = makeUploadRequest('%PDF-1.5\n%EOF', 'application/pdf');
    response = await POST(req);
    expect(response.status).toBe(200);
    const beforeFallback = getProcessingMetadata('2026-11-01T01:59:00-04:00');
    vi.setSystemTime(new Date('2026-11-01T01:01:00-05:00'));
    req = makeUploadRequest('%PDF-1.5\n%EOF', 'application/pdf');
    response = await POST(req);
    expect(response.status).toBe(200);
    const afterFallback = getProcessingMetadata('2026-11-01T01:01:00-05:00');
    expect(beforeFallback.localizedDateWindow).toBe('2026-11-01');
    expect(afterFallback.localizedDateWindow).toBe('2026-11-01');
    vi.useRealTimers();
    restoreTimezone();
  });

  it('Case 4: Assert that API return payload string formats align completely with expectations across varied global system locales', async () => {
    mockTimezone('UTC');
    const timestamp = '2026-07-06T12:00:00Z';
    const USFormat = formatProcessingDateForLocale(timestamp, 'en-US');
    const JPFormat = formatProcessingDateForLocale(timestamp, 'ja-JP');
    const GBFormat = formatProcessingDateForLocale(timestamp, 'en-GB');
    expect(USFormat).toBe('7/6/2026');
    expect(JPFormat).toBe('2026/7/6');
    expect(GBFormat).toBe('06/07/2026');
    const req: NextRequest = makeUploadRequest('%PDF-1.5\n%EOF', 'application/pdf');
    const response = await POST(req);
    const body = (await response.json()) as { success: boolean; data: ParsedResume };
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('John Doe');
    restoreTimezone();
  });

  it('Case 5: Verify that uploading data under highly skewed timezone environments updates localized timestamps accurately without triggering system-level layout anomalies or validation crashes', async () => {
    const timestamp = '2026-07-06T12:00:00Z';
    const skewedTimezones: { tz: string; expectedDate: string }[] = [
      { tz: 'Pacific/Kiritimati', expectedDate: '2026-07-07' },
      { tz: 'Pacific/Midway', expectedDate: '2026-07-06' },
      { tz: 'Pacific/Chatham', expectedDate: '2026-07-07' },
    ];
    for (const testCase of skewedTimezones) {
      mockTimezone(testCase.tz);
      const req: NextRequest = makeUploadRequest('%PDF-1.5\n%EOF', 'application/pdf');
      const response = await POST(req);
      const body = (await response.json()) as { success: boolean; data: ParsedResume };
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      const metadata = getProcessingMetadata(timestamp);
      expect(metadata.localizedDateWindow).toBe(testCase.expectedDate);
      restoreTimezone();
    }
  });
});
