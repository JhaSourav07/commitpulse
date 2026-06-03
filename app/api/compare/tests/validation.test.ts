import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

import { getFullDashboardData } from '@/lib/github';

const makeRequest = (search: string) => new Request(`http://localhost:3000/api/compare?${search}`);

describe('GET /api/compare - Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getFullDashboardData).mockResolvedValue({
      calendar: {
        totalContributions: 50,
        weeks: [],
      },
    } as never);
  });

  it('returns 400 when both usernames are missing', async () => {
    const res = await GET(makeRequest(''));

    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('returns 400 when user1 exceeds the maximum length', async () => {
    const res = await GET(makeRequest(`user1=${'a'.repeat(40)}&user2=octocat`));

    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('returns 400 for invalid username format', async () => {
    const res = await GET(makeRequest('user1=-invalid&user2=octocat'));

    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.details.fieldErrors.user1).toBeDefined();
  });

  it('returns 400 when comparing identical usernames', async () => {
    const res = await GET(makeRequest('user1=octocat&user2=octocat'));

    expect(res.status).toBe(400);

    const data = await res.json();

    expect(data.details.fieldErrors.user2).toContain('Cannot compare a user with themselves.');
  });

  it('returns 400 for self-comparison regardless of case', async () => {
    const res = await GET(makeRequest('user1=OctoCat&user2=octocat'));

    expect(res.status).toBe(400);
  });
});
