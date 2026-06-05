import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
vi.mock('../../../lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
}));

vi.mock('../../../lib/calculate', () => ({
  calculateStreak: vi.fn(),
}));

import { fetchGitHubContributions } from '../../../lib/github';
import { calculateStreak } from '../../../lib/calculate';

describe('OG Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 successfully', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({} as never);

    vi.mocked(calculateStreak).mockReturnValue({
      totalContributions: 120,
      longestStreak: 20,
      currentStreak: 5,
      todayDate: '2026-05-27',
    });

    const req = new NextRequest('http://localhost:3000/api/og?user=testuser');

    const res = await GET(req);

    expect(res).toBeDefined();
    expect(res.status).toBe(200);
  });

  it('falls back to zeros when github fetch fails', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValue(new Error('GitHub API failed'));

    const req = new NextRequest('http://localhost:3000/api/og?user=testuser');

    const res = await GET(req as never);

    expect(res.status).toBe(200);
  });

  it('handles missing user query param', async () => {
    const req = new NextRequest('http://localhost:3000/api/og');

    const res = await GET(req as never);

    expect(res.status).toBe(200);
  });

  it('handles custom themes and valid custom colors without crashing', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({} as never);
    vi.mocked(calculateStreak).mockReturnValue({
      totalContributions: 120,
      longestStreak: 20,
      currentStreak: 5,
      todayDate: '2026-05-27',
    });

    // Uses 4-digit hex shorthand for bg to ensure getLuminance handles it
    const req = new NextRequest(
      'http://localhost:3000/api/og?user=testuser&theme=dracula&bg=000&text=ffffff&accent=ff0000'
    );
    const res = await GET(req as never);

    expect(res).toBeDefined();
    expect(res.status).toBe(200);
  });

  it('handles invalid custom themes and invalid colors gracefully with fallbacks', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({} as never);
    vi.mocked(calculateStreak).mockReturnValue({
      totalContributions: 120,
      longestStreak: 20,
      currentStreak: 5,
      todayDate: '2026-05-27',
    });

    // Invalid theme and invalid hexes
    const req = new NextRequest(
      'http://localhost:3000/api/og?user=testuser&theme=non_existent_theme_xyz&bg=not-hex&text=xyz&accent=12'
    );
    const res = await GET(req as never);

    expect(res).toBeDefined();
    expect(res.status).toBe(200);
  });
});
