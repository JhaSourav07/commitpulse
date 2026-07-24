import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { GET as getStreakSvg } from '../route';
import { NextResponse } from 'next/server';

vi.mock('../route', () => ({
  GET: vi.fn(),
}));

vi.mock('@resvg/resvg-js', () => {
  return {
    Resvg: class {
      constructor() {}
      render() {
        return {
          asPng: () => Buffer.from('mock-png-data'),
        };
      }
    },
  };
});

vi.mock('sharp', () => {
  const sharpMock = () => {
    return {
      metadata: async () => ({ width: 800, height: 350 }),
      composite: () => {
        return {
          toBuffer: async () => Buffer.from('mock-stitched-buffer'),
        };
      },
      gif: () => {
        return {
          toBuffer: async () => Buffer.from('mock-gif-buffer'),
        };
      },
      webp: () => {
        return {
          toBuffer: async () => Buffer.from('mock-webp-buffer'),
        };
      },
    };
  };
  return {
    default: sharpMock,
  };
});

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/streak/animated');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('Animated Route GET /api/streak/animated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates animated GIF successfully', async () => {
    const mockSvgText = `<svg>
      <g class="cp-tower interactive-tower" style="animation-delay: 0.15s;"></g>
      <g class="cp-tower interactive-tower" style="animation-delay: 0.3s;"></g>
      <style>.scan-line { animation: scan-sweep 8s linear; }</style>
    </svg>`;
    const mockSvgResponse = new NextResponse(mockSvgText, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
        'X-Cache-Status': 'HIT',
      },
    });
    vi.mocked(getStreakSvg).mockResolvedValue(mockSvgResponse);

    const request = makeRequest({
      user: 'octocat',
      format: 'gif',
      fps: '10',
      duration: '1.5',
      loop: '0',
      entrance: 'rise',
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/gif');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=60');
    expect(response.headers.get('X-Cache-Status')).toBe('HIT');

    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.toString()).toBe('mock-gif-buffer');

    // Confirm we mocked the internal route with entrance=none
    const mockedCallArgs = vi.mocked(getStreakSvg).mock.calls[0][0];
    const callUrl = new URL(mockedCallArgs.url);
    expect(callUrl.searchParams.get('entrance')).toBe('none');
    expect(callUrl.searchParams.get('format')).toBe('svg');
    expect(callUrl.searchParams.get('minify')).toBe('false');
  });

  it('generates animated WebP successfully', async () => {
    const mockSvgText = `<svg>
      <g class="cp-tower interactive-tower" style="animation-delay: 0.15s;"></g>
      <style>.scan-line { animation: scan-sweep 8s linear; }</style>
    </svg>`;
    const mockSvgResponse = new NextResponse(mockSvgText, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    });
    vi.mocked(getStreakSvg).mockResolvedValue(mockSvgResponse);

    const request = makeRequest({
      user: 'octocat',
      format: 'webp',
      fps: '20',
      duration: '2.5',
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/webp');

    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.toString()).toBe('mock-webp-buffer');
  });

  it('returns 304 for cache hits based on ETag', async () => {
    const mockSvgText = `<svg></svg>`;
    vi.mocked(getStreakSvg).mockImplementation(async () => {
      return new NextResponse(mockSvgText, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=60',
        },
      });
    });

    const request1 = makeRequest({ user: 'octocat', format: 'gif' });
    const response1 = await GET(request1);
    const etag = response1.headers.get('ETag');
    expect(etag).toBeTruthy();

    const request2 = makeRequest({ user: 'octocat', format: 'gif' });
    request2.headers.set('If-None-Match', etag!);
    const response2 = await GET(request2);

    expect(response2.status).toBe(304);
    expect(await response2.text()).toBe('');
  });

  it('rejects invalid format', async () => {
    const request = makeRequest({ user: 'octocat', format: 'png' });
    const response = await GET(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('format must be "gif" or "webp"');
  });

  it('rejects invalid fps', async () => {
    const request = makeRequest({ user: 'octocat', format: 'gif', fps: '40' });
    const response = await GET(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('fps');
  });

  it('rejects invalid duration', async () => {
    const request = makeRequest({ user: 'octocat', format: 'gif', duration: '0.05' });
    const response = await GET(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('duration');
  });

  it('rejects invalid loop value', async () => {
    const request = makeRequest({ user: 'octocat', format: 'gif', loop: '200' });
    const response = await GET(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('loop');
  });

  it('rejects invalid entrance timing function', async () => {
    const request = makeRequest({ user: 'octocat', format: 'gif', entrance: 'jump' });
    const response = await GET(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('invalid entrance animation');
  });

  it('forwards error response from internal base route', async () => {
    const mockErrorResponse = NextResponse.json({ error: 'User not found' }, { status: 404 });
    vi.mocked(getStreakSvg).mockResolvedValue(mockErrorResponse);

    const request = makeRequest({ user: 'nonexistent', format: 'gif' });
    const response = await GET(request);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('User not found');
  });
});
