/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { GET as getStreakSvg } from '../route';
import { NextResponse } from 'next/server';

// Mock the core route
vi.mock('../route', () => ({
  GET: vi.fn(),
}));

// Mock resvg-js
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
  });

  it('forwards 400 error response when query parameters are missing/empty', async () => {
    const mockRequest = new Request('http://localhost:3000/api/streak/png');

    // Base route returns 400 when missing required params (like user)
    const mockErrorResponse = new NextResponse('<svg><text>Error</text></svg>', {
      status: 400,
      headers: { 'Content-Type': 'image/svg+xml' },
    });
    vi.mocked(getStreakSvg).mockResolvedValue(mockErrorResponse);

    const response = await GET(mockRequest);

    // Should return the forwarded response without modifying or crashing
    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
  });

  it('handles response safely when Content-Type is missing completely', async () => {
    const mockRequest = new Request('http://localhost:3000/api/streak/png?user=testuser');

    // Base route returns 200 but lacks Content-Type header
    const mockResponse = new NextResponse('<svg>missing headers</svg>', {
      status: 200,
      headers: new Headers(),
    });
    vi.mocked(getStreakSvg).mockResolvedValue(mockResponse);

    const response = await GET(mockRequest);

    // PNG route aborts conversion and returns the unmodified raw response
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain;charset=UTF-8');
    const text = await response.text();
    expect(text).toBe('<svg>missing headers</svg>');
  });

  it('handles response safely when Content-Type is incorrectly set', async () => {
    const mockRequest = new Request('http://localhost:3000/api/streak/png?user=testuser');

    // Base route returns 200 but with application/json
    const mockResponse = new NextResponse(JSON.stringify({ data: 'empty' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    vi.mocked(getStreakSvg).mockResolvedValue(mockResponse);

    const response = await GET(mockRequest);

    // PNG route aborts conversion
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('catches Resvg constructor error gracefully when an empty string SVG is returned', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockRequest = new Request('http://localhost:3000/api/streak/png?user=testuser');

    // Base route returns an empty SVG text payload but with the correct content type
    const mockSvgResponse = new NextResponse('', {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml' },
    });
    vi.mocked(getStreakSvg).mockResolvedValue(mockSvgResponse);

    const response = await GET(mockRequest);

    // Resvg should throw an error which should be caught, returning a 500 JSON payload
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to convert SVG to PNG');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('forwards 404 response safely when an unconfigured or unknown user object is accessed', async () => {
    const mockRequest = new Request('http://localhost:3000/api/streak/png?user=unknown_user_empty');

    // Base route returns 404 for unknown user
    const mockErrorResponse = new NextResponse('<svg><text>User Not Found</text></svg>', {
      status: 404,
      headers: { 'Content-Type': 'image/svg+xml' },
    });
    vi.mocked(getStreakSvg).mockResolvedValue(mockErrorResponse);

    const response = await GET(mockRequest);

    // Should return the forwarded response
    expect(response.status).toBe(404);
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
  });
});
