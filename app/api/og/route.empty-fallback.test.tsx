import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('OG Route Empty/Missing Inputs Verification', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(fetchGitHubContributions).mockResolvedValue({} as never);

    vi.mocked(calculateStreak).mockReturnValue({
      totalContributions: 0,
      longestStreak: 0,
      currentStreak: 0,
      todayDate: '2026-06-14',
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('falls back to the default user when user parameter is provided as an empty string', async () => {
    const request = new NextRequest('http://localhost:3000/api/og?user=');

    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('falls back to the default theme when theme parameter is an empty string', async () => {
    const request = new NextRequest('http://localhost:3000/api/og?user=testuser&theme=');

    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('falls back to theme colors when bg, text, and accent parameters are empty strings', async () => {
    const request = new NextRequest('http://localhost:3000/api/og?user=testuser&bg=&text=&accent=');

    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('continues generating an image response when contribution fetching fails and optional inputs are empty', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValueOnce(new Error('GitHub unavailable'));

    const request = new NextRequest('http://localhost:3000/api/og?user=&theme=&bg=&text=&accent=');

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('handles completely empty optional query values without throwing runtime errors', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/og?theme=&bg=&text=&accent=&refresh=&bypassCache='
    );

    const response = await GET(request);

    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });
});
