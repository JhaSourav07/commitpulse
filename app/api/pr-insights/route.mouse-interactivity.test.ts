import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { fetchPRInsights } from '@/services/github/pr-insights';

vi.mock('@/services/github/pr-insights', () => ({
  fetchPRInsights: vi.fn(),
}));

describe('pr-insights mouse interactivity contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when username is missing', async () => {
    const request = new Request('http://localhost/api/pr-insights');

    const response = await GET(request);

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body).toEqual({
      error: 'Username is required',
    });
  });

  it('calls fetchPRInsights with username from search params', async () => {
    vi.mocked(fetchPRInsights).mockResolvedValue([] as never);

    const request = new Request('http://localhost/api/pr-insights?username=aanya');

    await GET(request);

    expect(fetchPRInsights).toHaveBeenCalledWith('aanya');
  });

  it('returns fetched data on success', async () => {
    const mockData = [{ id: 1, title: 'PR 1' }];

    vi.mocked(fetchPRInsights).mockResolvedValue(mockData as never);

    const request = new Request('http://localhost/api/pr-insights?username=aanya');

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(mockData);
  });

  it('returns error message from thrown Error', async () => {
    vi.mocked(fetchPRInsights).mockRejectedValue(new Error('Service failed'));

    const request = new Request('http://localhost/api/pr-insights?username=aanya');

    const response = await GET(request);

    expect(response.status).toBe(500);

    const body = await response.json();

    expect(body).toEqual({
      error: 'Service failed',
    });
  });

  it('returns fallback error message for unknown thrown values', async () => {
    vi.mocked(fetchPRInsights).mockRejectedValue('unknown');

    const request = new Request('http://localhost/api/pr-insights?username=aanya');

    const response = await GET(request);

    expect(response.status).toBe(500);

    const body = await response.json();

    expect(body).toEqual({
      error: 'Failed to fetch PR insights',
    });
  });
});
