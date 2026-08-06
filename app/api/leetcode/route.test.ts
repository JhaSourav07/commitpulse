import { GET } from './route';
import * as api from '@/services/leetcode/api';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/services/leetcode/api', () => ({
  getLeetCodeStats: vi.fn(),
}));

describe('GET /api/leetcode', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for missing username parameter', async () => {
    const req = new Request('http://localhost/api/leetcode');
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(res.headers.get('Content-Type')).toContain('image/svg+xml');

    const text = await res.text();
    expect(text).toContain('Username is required');
  });

  it('returns 400 for invalid bg color parameter', async () => {
    const req = new Request('http://localhost/api/leetcode?username=user&bg=invalid');
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(res.headers.get('Content-Type')).toContain('image/svg+xml');

    const text = await res.text();
    expect(text).toContain('bg must be a valid hex color');
  });

  it('returns 200 SVG with valid user stats', async () => {
    vi.mocked(api.getLeetCodeStats).mockResolvedValue({
      username: 'leetcode_dev',
      totalSolved: 300,
      easySolved: 100,
      mediumSolved: 150,
      hardSolved: 50,
      ranking: 5000,
    });

    const req = new Request('http://localhost/api/leetcode?username=leetcode_dev&theme=dark');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml; charset=utf-8');

    const text = await res.text();
    expect(text).toContain("leetcode_dev's LeetCode Stats");
    expect(text).toContain('Rank #5,000');
    expect(text).toContain('300');
  });

  it('returns 304 if ETag matches', async () => {
    vi.mocked(api.getLeetCodeStats).mockResolvedValue({
      username: 'leetcode_dev',
      totalSolved: 300,
      easySolved: 100,
      mediumSolved: 150,
      hardSolved: 50,
      ranking: 5000,
    });

    const req1 = new Request('http://localhost/api/leetcode?username=leetcode_dev');
    const res1 = await GET(req1);
    const etag = res1.headers.get('ETag');
    expect(etag).toBeTruthy();

    const req2 = new Request('http://localhost/api/leetcode?username=leetcode_dev', {
      headers: {
        'If-None-Match': etag as string,
      },
    });
    const res2 = await GET(req2);
    expect(res2.status).toBe(304);
  });
});
