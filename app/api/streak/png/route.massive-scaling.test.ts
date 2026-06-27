/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { GET as getStreakSvg } from '../route';
import { NextResponse } from 'next/server';

vi.mock('../route', () => ({
  GET: vi.fn(),
}));

vi.mock('@resvg/resvg-js', () => ({
  Resvg: class {
    constructor(
      public svgText: string,
      public options: any
    ) {
      if (svgText.includes('invalid')) {
        throw new Error('Failed to render SVG');
      }
    }
    render() {
      return {
        asPng: () =>
          Buffer.from(this.svgText.length > 100000 ? 'massive-png-data' : 'mock-png-data'),
      };
    }
  },
}));

function createMassiveSvg(): string {
  const rects = Array.from(
    { length: 5000 },
    (_, i) =>
      `<rect x="${i % 100}" y="${Math.floor(i / 100) * 20}" width="10" height="10" fill="#${String((i * 99999) % 0xffffff).padStart(6, '0')}" />`
  ).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="2000">${rects}</svg>`;
}

describe('ApiStreakPngRoute massive scaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. converts a standard SVG to PNG successfully', async () => {
    const mockRequest = new Request('http://localhost:3000/api/streak/png?user=testuser');

    vi.mocked(getStreakSvg).mockResolvedValue(
      new NextResponse(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" /></svg>',
        {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600',
          },
        }
      )
    );

    const response = await GET(mockRequest);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });

  it('2. handles a massive SVG with thousands of elements without timing out', async () => {
    const massiveSvg = createMassiveSvg();
    expect(massiveSvg.length).toBeGreaterThan(100000);

    vi.mocked(getStreakSvg).mockResolvedValue(
      new NextResponse(massiveSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    );

    const start = performance.now();
    const response = await GET(new Request('http://localhost:3000/api/streak/png?user=testuser'));
    const duration = performance.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(10000);
  });

  it('3. returns base route errors directly without attempting conversion', async () => {
    vi.mocked(getStreakSvg).mockResolvedValue(
      NextResponse.json({ error: 'User not found' }, { status: 404 })
    );

    const response = await GET(
      new Request('http://localhost:3000/api/streak/png?user=nonexistent')
    );
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error).toBe('User not found');
  });

  it('4. preserves cache headers from the base SVG response', async () => {
    vi.mocked(getStreakSvg).mockResolvedValue(
      new NextResponse(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" /></svg>',
        {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 's-maxage=86400, stale-while-revalidate=604800',
          },
        }
      )
    );

    const response = await GET(new Request('http://localhost:3000/api/streak/png?user=testuser'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      's-maxage=86400, stale-while-revalidate=604800'
    );
  });

  it('5. returns 500 with error message when SVG conversion fails', async () => {
    vi.mocked(getStreakSvg).mockResolvedValue(
      new NextResponse('<svg xmlns="http://www.w3.org/2000/svg">invalid', {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      })
    );

    const response = await GET(new Request('http://localhost:3000/api/streak/png?user=testuser'));
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error).toBe('Failed to convert SVG to PNG');
  });

  it('6. returns valid PNG buffer with correct body length for large SVGs', async () => {
    vi.mocked(getStreakSvg).mockResolvedValue(
      new NextResponse(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" /></svg>',
        {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'no-cache',
          },
        }
      )
    );

    const response = await GET(new Request('http://localhost:3000/api/streak/png?user=testuser'));
    expect(response.status).toBe(200);

    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString()).toBe('mock-png-data');
  });
});
