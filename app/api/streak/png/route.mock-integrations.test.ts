import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSvgGET, renderSpy, asPngSpy, ResvgMock } = vi.hoisted(() => {
  const asPngSpy = vi.fn();
  const renderSpy = vi.fn();

  const ResvgMock = vi.fn(function () {
    return {
      render: renderSpy,
    };
  });

  return {
    mockSvgGET: vi.fn(),
    renderSpy,
    asPngSpy,
    ResvgMock,
  };
});

vi.mock('../route', () => ({
  GET: mockSvgGET,
}));

vi.mock('@resvg/resvg-js', () => ({
  Resvg: ResvgMock,
}));

import { GET } from './route';

describe('ApiStreakPngRoute Mock Integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    asPngSpy.mockReturnValue(Buffer.from('mock-png'));

    renderSpy.mockReturnValue({
      asPng: asPngSpy,
    });
  });

  it('delegates request handling to the upstream SVG route', async () => {
    const request = new Request('http://localhost/api/streak/png?user=testuser');

    mockSvgGET.mockResolvedValue(
      new Response('<svg>test</svg>', {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      })
    );

    await GET(request);

    expect(mockSvgGET).toHaveBeenCalledTimes(1);
    expect(mockSvgGET).toHaveBeenCalledWith(request);
  });

  it('passes SVG content returned by the upstream route into Resvg', async () => {
    mockSvgGET.mockResolvedValue(
      new Response('<svg id="integration-test"></svg>', {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      })
    );

    await GET(new Request('http://localhost/api/streak/png'));

    expect(ResvgMock).toHaveBeenCalledTimes(1);

    expect(ResvgMock).toHaveBeenCalledWith(
      '<svg id="integration-test"></svg>',
      expect.objectContaining({
        font: {
          loadSystemFonts: true,
        },
        fitTo: {
          mode: 'original',
        },
      })
    );
  });

  it('initializes Resvg with the expected rendering configuration', async () => {
    mockSvgGET.mockResolvedValue(
      new Response('<svg></svg>', {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      })
    );

    await GET(new Request('http://localhost/api/streak/png'));

    expect(ResvgMock).toHaveBeenCalledWith(
      '<svg></svg>',
      expect.objectContaining({
        font: {
          loadSystemFonts: true,
        },
        fitTo: {
          mode: 'original',
        },
      })
    );
  });

  it('executes the complete render to PNG conversion pipeline', async () => {
    mockSvgGET.mockResolvedValue(
      new Response('<svg></svg>', {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    );

    const response = await GET(new Request('http://localhost/api/streak/png'));

    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(asPngSpy).toHaveBeenCalledTimes(1);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
  });

  it('preserves cache headers from the upstream SVG response', async () => {
    mockSvgGET.mockResolvedValue(
      new Response('<svg></svg>', {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    );

    const response = await GET(new Request('http://localhost/api/streak/png'));

    expect(response.headers.get('Content-Type')).toBe('image/png');

    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });
});
