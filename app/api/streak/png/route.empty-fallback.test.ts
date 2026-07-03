/* eslint-disable @typescript-eslint/no-explicit-any */
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
      constructor(svg: string) {
        if (!svg || svg === '') {
          throw new Error('Empty SVG');
        }
        if ((global as any).throwResvgError) {
          throw new Error('Resvg crash');
        }
      }

      render() {
        return {
          asPng: () => Buffer.from('mock-png-data'),
        };
      }
    },
  };
});

describe('PNG Route - Edge Cases & Empty Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).throwResvgError = false;
  });

  it('forwards 400 error response when query parameters are missing/empty', async () => {
    const mockRequest = new Request('http://localhost:3000/api/streak/png');

    const mockErrorResponse = new NextResponse('<svg><text>Error</text></svg>', {
      status: 400,
      headers: { 'Content-Type': 'image/svg+xml' },
    });

    vi.mocked(getStreakSvg).mockResolvedValue(mockErrorResponse);

    const response = await GET(mockRequest);

    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
  });

  it('handles response safely when Content-Type is missing completely', async () => {
    const mockRequest = new Request('http://localhost:3000/api/streak/png?user=testuser');

    const mockResponse = new NextResponse('<svg>missing headers</svg>', {
      status: 200,
      headers: new Headers(),
    });

    vi.mocked(getStreakSvg).mockResolvedValue(mockResponse);

    const response = await GET(mockRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain;charset=UTF-8');

    const text = await response.text();
    expect(text).toBe('<svg>missing headers</svg>');
  });

  it('handles response safely when Content-Type is incorrectly set', async () => {
    const mockRequest = new Request('http://localhost:3000/api/streak/png?user=testuser');

    const mockResponse = new NextResponse(JSON.stringify({ data: 'empty' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    vi.mocked(getStreakSvg).mockResolvedValue(mockResponse);

    const response = await GET(mockRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('catches Resvg constructor error gracefully when an empty string SVG is returned', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockRequest = new Request('http://localhost:3000/api/streak/png?user=testuser');

    const mockSvgResponse = new NextResponse('', {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml' },
    });

    vi.mocked(getStreakSvg).mockResolvedValue(mockSvgResponse);

    const response = await GET(mockRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('image/svg+xml');
    expect(response.headers.get('Cache-Control')).toBe('no-store');

    const svg = await response.text();

    expect(svg).toContain('<svg');
    expect(svg).toContain('Failed to render streak image');
    expect(svg).not.toContain('Empty SVG');
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('forwards 404 response safely when an unconfigured or unknown user object is accessed', async () => {
    const mockRequest = new Request('http://localhost:3000/api/streak/png?user=unknown_user_empty');

    const mockErrorResponse = new NextResponse('<svg><text>User Not Found</text></svg>', {
      status: 404,
      headers: { 'Content-Type': 'image/svg+xml' },
    });

    vi.mocked(getStreakSvg).mockResolvedValue(mockErrorResponse);

    const response = await GET(mockRequest);

    expect(response.status).toBe(404);
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
  });
});
