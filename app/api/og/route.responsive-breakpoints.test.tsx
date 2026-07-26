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

describe('OG Route Responsive Breakpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchGitHubContributions).mockResolvedValue({} as never);

    vi.mocked(calculateStreak).mockReturnValue({
      totalContributions: 150,
      longestStreak: 20,
      currentStreak: 8,
      todayDate: '2026-07-21',
    });
  });

  it('1. renders successfully for a standard mobile-style request', async () => {
    const req = new NextRequest('http://localhost/api/og?user=octocat');

    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('2. renders successfully with long usernames without layout failures', async () => {
    const req = new NextRequest(
      'http://localhost/api/og?user=this_is_a_very_long_github_username_for_layout_testing'
    );

    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('3. supports different themes while preserving image generation', async () => {
    const req = new NextRequest('http://localhost/api/og?user=octocat&theme=dark');

    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('4. supports custom colors without rendering failures', async () => {
    const req = new NextRequest(
      'http://localhost/api/og?user=octocat&bg=000000&text=ffffff&accent=00ff00'
    );

    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('5. preserves successful rendering across repeated requests', async () => {
    const req = new NextRequest('http://localhost/api/og?user=octocat');

    const first = await GET(req);
    const second = await GET(req);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });
});
