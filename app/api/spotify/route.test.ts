import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('../../../services/spotify/api', () => ({
  getCurrentlyPlaying: vi.fn(),
}));

import { getCurrentlyPlaying } from '../../../services/spotify/api';

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/spotify');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Spotify Route', () => {
  it('returns 400 for invalid width', async () => {
    const response = await GET(makeRequest({ width: 'invalid' }));
    expect(response.status).toBe(400);
    const body = await response.text();
    expect(body).toContain('width must be an integer');
  });

  it('generates offline SVG when not playing', async () => {
    vi.mocked(getCurrentlyPlaying).mockResolvedValue({
      isPlaying: false,
    });

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const svg = await response.text();
    expect(svg).toContain('Not Currently Playing');
    expect(svg).toContain('Spotify');
  });

  it('generates playing SVG when track is playing', async () => {
    vi.mocked(getCurrentlyPlaying).mockResolvedValue({
      isPlaying: true,
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
      progressMs: 30000,
      durationMs: 354000,
      albumImageUrl: 'https://i.scdn.co/image/ab67616d0000b273e8b066f70c206551210d902b',
    });

    // Mock fetch for the image base64
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });

    const response = await GET(makeRequest({ theme: 'dark' }));
    expect(response.status).toBe(200);
    const svg = await response.text();
    expect(svg).toContain('Bohemian Rhapsody');
    expect(svg).toContain('Queen');
    // base64 mock
    expect(svg).toContain('data:image/jpeg;base64,AAAAAAAAAAA=');
  });

  it('handles custom styling parameters', async () => {
    vi.mocked(getCurrentlyPlaying).mockResolvedValue({
      isPlaying: false,
    });

    const response = await GET(makeRequest({ bg: 'ff0000', text: '00ff00', width: '600' }));
    expect(response.status).toBe(200);
    const svg = await response.text();
    // width
    expect(svg).toContain('width="600"');
    // bg
    expect(svg).toContain('fill="#ff0000"');
  });
});
