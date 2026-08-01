import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/github', () => ({
  getWrappedData: vi.fn(),

  getCircuitTelemetry: vi.fn().mockReturnValue({ isOpen: false, resetInMs: 0 }),
}));

import { getWrappedData, getCircuitTelemetry } from '@/lib/github';

import type { ContributionCalendar } from '../../../types';
import type { WrappedStats } from '../../../types/dashboard';
import { refreshPolicy } from '../../../services/github/refresh-policy';
import { refreshRateLimiter } from '../../../services/github/refresh-rate-limiter';
import { quotaMonitor } from '../../../services/github/quota-monitor';

const mockCalendar: ContributionCalendar = {
  totalContributions: 1420,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 5, date: '2025-11-19' },
        { contributionCount: 42, date: '2025-11-20' },
        { contributionCount: 12, date: '2025-11-21' },
      ],
    },
  ],
};

const mockWrappedStats: WrappedStats = {
  totalContributions: 1420,
  mostActiveDate: '2025-11-20',
  highestDailyCount: 42,
  busiestMonth: '2025-11',
  weekendRatio: 24,
  topLanguage: 'TypeScript',
  calendar: mockCalendar,
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/wrapped');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('Timezone normalization & calendar boundary alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refreshPolicy.reset();
    refreshRateLimiter.reset();
    quotaMonitor.reset();
    vi.mocked(getCircuitTelemetry).mockReturnValue({ isOpen: false, resetInMs: 0 });
    vi.mocked(getWrappedData).mockResolvedValue(mockWrappedStats);
  });
  it('passes Asia/Kolkata timezone to getWrappedData', async () => {
    vi.mocked(getWrappedData).mockResolvedValue(mockWrappedStats);

    await GET(
      makeRequest({
        user: 'octocat',
        tz: 'Asia/Kolkata',
      })
    );

    expect(getWrappedData).toHaveBeenCalledWith(
      'octocat',
      expect.any(String),
      { bypassCache: false },
      'Asia/Kolkata'
    );
  });
  it('passes UTC timezone to getWrappedData', async () => {
    vi.mocked(getWrappedData).mockResolvedValue(mockWrappedStats);

    await GET(
      makeRequest({
        user: 'octocat',
        tz: 'UTC',
      })
    );

    expect(getWrappedData).toHaveBeenCalledWith(
      'octocat',
      expect.any(String),
      { bypassCache: false },
      'UTC'
    );
  });
  it('calls getWrappedData without timezone when tz is not provided', async () => {
    vi.mocked(getWrappedData).mockClear();
    vi.mocked(getWrappedData).mockResolvedValue(mockWrappedStats);

    await GET(
      makeRequest({
        user: 'octocat',
      })
    );

    expect(getWrappedData).toHaveBeenCalledTimes(1);

    expect(vi.mocked(getWrappedData).mock.calls[0]).toHaveLength(3);

    expect(getWrappedData).toHaveBeenCalledWith('octocat', expect.any(String), {
      bypassCache: false,
    });
  });
  it('uses custom year instead of timezone derived year', async () => {
    vi.mocked(getWrappedData).mockClear();
    vi.mocked(getWrappedData).mockResolvedValue(mockWrappedStats);

    await GET(
      makeRequest({
        user: 'octocat',
        tz: 'Asia/Tokyo',
        year: '2022',
      })
    );

    expect(getWrappedData).toHaveBeenCalledWith(
      'octocat',
      '2022',
      { bypassCache: false },
      'Asia/Tokyo'
    );
  });
  it('passes bypassCache=true when refresh=true is provided', async () => {
    vi.mocked(getWrappedData).mockClear();
    vi.mocked(getWrappedData).mockResolvedValue(mockWrappedStats);

    await GET(
      makeRequest({
        user: 'octocat',
        refresh: 'true',
      })
    );

    expect(getWrappedData).toHaveBeenCalledWith('octocat', expect.any(String), {
      bypassCache: true,
    });
  });
});
