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
      constructor() {
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

describe('PNG Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('converts SVG to PNG successfully', async () => {
    const mockRequest = new Request('http://localhost:3000/api/streak/png?user=testuser');

    // Setup mock SVG response
    const mockSvgResponse = new NextResponse('<svg>test</svg>', {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
    vi.mocked(getStreakSvg).mockResolvedValue(mockSvgResponse);

    const response = await GET(mockRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');

    // Check if body contains buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.toString()).toBe('mock-png-data');
  });

  it('returns errors from the base route directly', async () => {
    const mockRequest = new Request('http://localhost:3000/api/streak/png');

    const mockErrorResponse = NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    vi.mocked(getStreakSvg).mockResolvedValue(mockErrorResponse);

    const response = await GET(mockRequest);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid parameters');
  });

  it('handles SVG conversion errors without leaking internal error details', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockRequest = new Request('http://localhost:3000/api/streak/png?user=testuser');

    const mockSvgResponse = new NextResponse('<svg>invalid</svg>', {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
      },
    });
    vi.mocked(getStreakSvg).mockResolvedValue(mockSvgResponse);

    // Force an error in Resvg
    (global as any).throwResvgError = true;

    const response = await GET(mockRequest);

    (global as any).throwResvgError = false;

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to convert SVG to PNG');
    expect(data.details).toBeUndefined();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
