import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSvgGET, MockResvg } = vi.hoisted(() => ({
  mockSvgGET: vi.fn(),
  MockResvg: vi.fn(),
}));

vi.mock('../route', () => ({
  GET: mockSvgGET,
}));

vi.mock('@resvg/resvg-js', () => ({
  Resvg: MockResvg,
}));

import { GET } from './route';

describe('GET /api/streak/png - Error Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns fallback SVG when PNG conversion fails', async () => {
    mockSvgGET.mockResolvedValue(
      new Response('<svg></svg>', {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      })
    );

    MockResvg.mockImplementation(() => {
      throw new Error('Rendering failed');
    });

    const response = await GET(new Request('http://localhost/api/streak/png'));

    expect(response.status).toBe(200);

    expect(await response.text()).toContain('Failed to render streak image');
  });

  it('logs conversion errors', async () => {
    mockSvgGET.mockResolvedValue(
      new Response('<svg></svg>', {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      })
    );

    MockResvg.mockImplementation(() => {
      throw new Error('Renderer crashed');
    });

    await GET(new Request('http://localhost/api/streak/png'));

    expect(console.error).toHaveBeenCalled();
  });

  it('returns upstream response when SVG endpoint fails', async () => {
    mockSvgGET.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'User not found',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    );

    const response = await GET(new Request('http://localhost/api/streak/png'));

    expect(response.status).toBe(404);
  });

  it('handles non Error exceptions safely', async () => {
    mockSvgGET.mockResolvedValue(
      new Response('<svg></svg>', {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      })
    );

    MockResvg.mockImplementation(() => {
      throw 'failed';
    });

    const response = await GET(new Request('http://localhost/api/streak/png'));

    expect(response.status).toBe(200);

    expect(await response.text()).toContain('Failed to render streak image');
  });

  it('returns PNG when conversion succeeds', async () => {
    mockSvgGET.mockResolvedValue(
      new Response('<svg></svg>', {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public',
        },
      })
    );

    MockResvg.mockImplementation(function () {
      return {
        render() {
          return {
            asPng() {
              return Buffer.from('png');
            },
          };
        },
      };
    });

    const response = await GET(new Request('http://localhost/api/streak/png'));

    expect(response.status).toBe(200);

    expect(response.headers.get('Content-Type')).toBe('image/png');

    expect(response.headers.get('Cache-Control')).toBe('public');
  });
});
