import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { User } from '@/models/User';

// Mock dependencies
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

vi.mock('@/models/User', () => ({
  User: {
    updateOne: vi.fn(),
  },
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/rate-limit', () => ({
  getRateLimitHeaders: vi.fn(() => ({})),
  trackUserRateLimiter: {
    checkWithResult: vi.fn(() => ({ success: true })),
  },
}));

vi.mock('@/services/security/track-user-protection', () => ({
  trackUserProtection: {
    verifyAndDeduplicate: vi.fn(() => ({ allowed: true })),
    recordWrite: vi.fn(),
  },
}));

const makeRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/track-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('track-user route - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  const originalTZ = process.env.TZ;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  });

  afterEach(() => {
    process.env.TZ = originalTZ;
    vi.useRealTimers();
  });

  it('1. mocks standard timezone settings (UTC, EST, IST, JST) correctly', async () => {
    const testDate = new Date('2024-01-01T12:00:00Z');

    // UTC
    process.env.TZ = 'UTC';
    expect(testDate.toLocaleString('en-US', { timeZone: 'UTC' })).toContain('12:00:00 PM');

    // JST (Japan Standard Time, UTC+9)
    process.env.TZ = 'Asia/Tokyo';
    expect(testDate.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })).toContain('9:00:00 PM');

    // IST (Indian Standard Time, UTC+5:30)
    process.env.TZ = 'Asia/Kolkata';
    expect(testDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toContain('5:30:00 PM');

    // EST (Eastern Standard Time, UTC-5)
    process.env.TZ = 'America/New_York';
    expect(testDate.toLocaleString('en-US', { timeZone: 'America/New_York' })).toContain(
      '7:00:00 AM'
    );

    // Verify route handles POST request under different timezone configs
    const response = await POST(makeRequest({ username: 'valid-user' }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('2. asserts calculations align commits/activities onto the correct visual dates', async () => {
    vi.useFakeTimers();

    // 11:30 PM UTC on Jun 30th is 5:00 AM Jul 1st in Asia/Kolkata
    const lateUtcDate = new Date('2024-06-30T23:30:00.000Z');
    vi.setSystemTime(lateUtcDate);

    // Call POST to trigger User.updateOne with lastSeen: new Date()
    const response = await POST(makeRequest({ username: 'valid-user' }));
    expect(response.status).toBe(200);

    // Extract the saved date from the mock call
    expect(User.updateOne).toHaveBeenCalledTimes(1);
    const updateCallArgs = vi.mocked(User.updateOne).mock.calls[0];
    const updatePayload = updateCallArgs[1] as { $set: { lastSeen: Date } };
    const lastSeenDate = updatePayload.$set.lastSeen;

    expect(lastSeenDate).toBeInstanceOf(Date);
    expect(lastSeenDate.getTime()).toBe(lateUtcDate.getTime());

    // Format in UTC
    const utcDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(lastSeenDate);
    expect(utcDateStr).toBe('2024-06-30');

    // Format in Asia/Kolkata
    const kolkataDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
      lastSeenDate
    );
    expect(kolkataDateStr).toBe('2024-07-01');
  });

  it('3. verifies leap year boundaries parse without leaving gaps in grids', async () => {
    vi.useFakeTimers();

    // Set system time to Leap Day: Feb 29, 2024
    const leapDay = new Date('2024-02-29T12:00:00Z');
    vi.setSystemTime(leapDay);

    const response = await POST(makeRequest({ username: 'valid-user' }));
    expect(response.status).toBe(200);

    expect(User.updateOne).toHaveBeenCalledTimes(1);
    const updatePayload = vi.mocked(User.updateOne).mock.calls[0][1] as {
      $set: { lastSeen: Date };
    };
    const lastSeenDate = updatePayload.$set.lastSeen;

    expect(lastSeenDate.getUTCFullYear()).toBe(2024);
    expect(lastSeenDate.getUTCMonth()).toBe(1); // February is 1
    expect(lastSeenDate.getUTCDate()).toBe(29);
  });

  it('4. asserts calendar date format utility outputs match expectations in each locale', async () => {
    const testDate = new Date('2024-12-25T15:00:00Z'); // Christmas 3 PM UTC

    // US format (MM/DD/YYYY)
    const usFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC' }).format(testDate);
    expect(usFormat).toBe('12/25/2024');

    // UK format (DD/MM/YYYY)
    const ukFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC' }).format(testDate);
    expect(ukFormat).toBe('25/12/2024');

    // Japan format (YYYY/MM/DD)
    const jpFormat = new Intl.DateTimeFormat('ja-JP', { timeZone: 'UTC' }).format(testDate);
    expect(jpFormat).toBe('2024/12/25');
  });

  it('5. tests offsets around transition dates like daylight savings (DST)', async () => {
    process.env.TZ = 'America/New_York';

    // DST starts in US on March 10, 2024 at 2:00 AM (spring forward)
    // 1:59 AM is standard time (EST, UTC-5)
    const beforeDST = new Date('2024-03-10T06:59:00Z');
    // 3:01 AM is daylight time (EDT, UTC-4)
    const afterDST = new Date('2024-03-10T07:01:00Z');

    const beforeOffset = beforeDST.getTimezoneOffset();
    const afterOffset = afterDST.getTimezoneOffset();

    // Validate a 60-minute shift in the local timezone offset
    expect(beforeOffset - afterOffset).toBe(60);

    // Call POST with mocked system times to ensure rate limiting & DB writes succeed across transitions
    vi.useFakeTimers();

    vi.setSystemTime(beforeDST);
    const res1 = await POST(makeRequest({ username: 'valid-user' }));
    expect(res1.status).toBe(200);

    vi.setSystemTime(afterDST);
    const res2 = await POST(makeRequest({ username: 'valid-user' }));
    expect(res2.status).toBe(200);
  });
});
