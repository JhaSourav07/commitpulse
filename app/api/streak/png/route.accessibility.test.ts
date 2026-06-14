import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockAsPng = vi.fn();

const mockRender = vi.fn(() => ({
  asPng: mockAsPng,
}));

class MockResvg {
  render() {
    return mockRender();
  }
}

vi.mock('@resvg/resvg-js', () => ({
  Resvg: MockResvg,
}));

const mockGetStreakSvg = vi.fn();

vi.mock('../route', () => ({
  GET: mockGetStreakSvg,
}));

describe('ApiStreakPngRoute Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns PNG content type for accessible image consumers', async () => {
    mockAsPng.mockReturnValue(Buffer.from('png-data'));

    mockGetStreakSvg.mockResolvedValue(
      new NextResponse('<svg></svg>', {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      })
    );

    const { GET } = await import('./route');

    const response = await GET(new Request('http://localhost/api/streak/png'));

    expect(response.headers.get('Content-Type')).toBe('image/png');
  });

  it('preserves cache headers for assistive technology stability', async () => {
    mockAsPng.mockReturnValue(Buffer.from('png-data'));

    mockGetStreakSvg.mockResolvedValue(
      new NextResponse('<svg></svg>', {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    );

    const { GET } = await import('./route');

    const response = await GET(new Request('http://localhost/api/streak/png'));

    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });

  it('returns original error responses unchanged', async () => {
    mockGetStreakSvg.mockResolvedValue(
      NextResponse.json(
        { error: 'Bad request' },
        {
          status: 400,
        }
      )
    );

    const { GET } = await import('./route');

    const response = await GET(new Request('http://localhost/api/streak/png'));

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body.error).toBe('Bad request');
  });

  it('returns readable JSON error response on PNG conversion failure', async () => {
    mockRender.mockImplementationOnce(() => {
      throw new Error('PNG conversion failed');
    });

    mockGetStreakSvg.mockResolvedValue(
      new NextResponse('<svg></svg>', {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      })
    );

    const { GET } = await import('./route');

    const response = await GET(new Request('http://localhost/api/streak/png'));

    expect(response.status).toBe(500);

    const body = await response.json();

    expect(body.error).toContain('Failed to convert SVG to PNG');
  });

  it('returns binary PNG data successfully for downstream accessible consumers', async () => {
    mockAsPng.mockReturnValue(Buffer.from('binary-png'));

    mockGetStreakSvg.mockResolvedValue(
      new NextResponse('<svg></svg>', {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      })
    );

    const { GET } = await import('./route');

    const response = await GET(new Request('http://localhost/api/streak/png'));

    const buffer = await response.arrayBuffer();

    expect(buffer.byteLength).toBeGreaterThan(0);

    expect(mockAsPng).toHaveBeenCalled();
  });
});
