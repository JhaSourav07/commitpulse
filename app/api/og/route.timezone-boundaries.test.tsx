import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
}));

vi.mock('@/lib/calculate', () => ({
  calculateStreak: vi.fn(),
}));

import { fetchGitHubContributions } from '@/lib/github';
import { calculateStreak } from '@/lib/calculate';

describe('OG Route Timezone Boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: {},
    } as never);

    vi.mocked(calculateStreak).mockReturnValue({
      totalContributions: 365,
      longestStreak: 45,
      currentStreak: 12,
      todayDate: '2026-07-18',
    });
  });

  it('returns a consistent image for a UTC calendar boundary', async () => {
    const req = new NextRequest('http://localhost:3000/api/og?user=testuser&timezone=UTC');

    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('preserves contribution rendering across a negative timezone offset', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/og?user=testuser&timezone=America/New_York'
    );

    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('preserves contribution rendering across positive IST and JST offsets', async () => {
    const req = new NextRequest('http://localhost:3000/api/og?user=testuser&timezone=Asia/Kolkata');

    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('handles leap-year calendar boundaries without rendering failures', async () => {
    const req = new NextRequest('http://localhost:3000/api/og?user=testuser&date=2024-02-29');

    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('keeps rendering stable around daylight-saving transition dates', async () => {
    const req = new NextRequest('http://localhost:3000/api/og?user=testuser&date=2026-03-08');

    const res = await GET(req);

    expect(res.status).toBe(200);
  });
});
