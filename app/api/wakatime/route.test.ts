import { GET } from './route';
import * as api from '@/services/wakatime/api';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/services/wakatime/api', () => ({
  getWakaTimeStats: vi.fn(),
}));

describe('GET /api/wakatime', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid parameters (e.g. invalid bg color)', async () => {
    const req = new Request('http://localhost/api/wakatime?bg=invalid');
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml');

    const text = await res.text();
    expect(text).toContain('bg must be a valid hex color');
  });

  it('returns 200 SVG with valid data', async () => {
    vi.mocked(api.getWakaTimeStats).mockResolvedValue({
      isConfigured: true,
      totalSeconds: 36000,
      humanReadableTotal: '10 hrs 0 mins',
      languages: [{ name: 'TypeScript', percent: 60.5, total_seconds: 21600, text: '6 hrs' }],
    });

    const req = new Request('http://localhost/api/wakatime?theme=dark');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml; charset=utf-8');

    const text = await res.text();
    expect(text).toContain('WakaTime Stats');
    expect(text).toContain('TypeScript');
    expect(text).toContain('10 hrs 0 mins');
  });

  it('returns 304 if ETag matches', async () => {
    vi.mocked(api.getWakaTimeStats).mockResolvedValue({
      isConfigured: true,
      totalSeconds: 36000,
      humanReadableTotal: '10 hrs 0 mins',
      languages: [],
    });

    // First request to get the ETag
    const req1 = new Request('http://localhost/api/wakatime');
    const res1 = await GET(req1);
    const etag = res1.headers.get('ETag');
    expect(etag).toBeTruthy();

    // Second request with If-None-Match
    const req2 = new Request('http://localhost/api/wakatime', {
      headers: {
        'If-None-Match': etag as string,
      },
    });
    const res2 = await GET(req2);
    expect(res2.status).toBe(304);
  });
});
