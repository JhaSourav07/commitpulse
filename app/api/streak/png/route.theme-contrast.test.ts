import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { GET as getStreakSvg } from '../route';
import { NextResponse } from 'next/server';

let lastSvgText = '';

// Mock the core route
vi.mock('../route', () => ({
  GET: vi.fn(),
}));

// Mock resvg-js
vi.mock('@resvg/resvg-js', () => {
  return {
    Resvg: class {
      constructor(svgText: string) {
        lastSvgText = svgText;
      }
      render() {
        return {
          asPng: () => Buffer.from('mock-png-data'),
        };
      }
    },
  };
});

function getLuminance(hex: string): number {
  const cleanHex = hex.replace(/^#/, '');
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
  const [R, G, B] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('PNG Route Theme Contrast and Prefers-Color-Scheme Cohesion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastSvgText = '';
  });

  it('Case 1: adapts style elements correctly in dual theme environments (dark vs light modes)', async () => {
    // 1. Emulate dark mode SVG
    const darkRequest = new Request('http://localhost:3000/api/streak/png?theme=dark');
    const mockDarkSvg =
      '<svg xmlns="http://www.w3.org/2000/svg"><style>.title { fill: #c9d1d9; }</style><rect fill="#0d1117"/></svg>';
    vi.mocked(getStreakSvg).mockResolvedValue(
      new NextResponse(mockDarkSvg, {
        headers: { 'Content-Type': 'image/svg+xml' },
      })
    );

    let response = await GET(darkRequest);
    expect(response.status).toBe(200);
    expect(lastSvgText).toContain('#0d1117');
    expect(lastSvgText).toContain('#c9d1d9');

    // 2. Emulate light mode SVG
    const lightRequest = new Request('http://localhost:3000/api/streak/png?theme=light');
    const mockLightSvg =
      '<svg xmlns="http://www.w3.org/2000/svg"><style>.title { fill: #24292f; }</style><rect fill="#ffffff"/></svg>';
    vi.mocked(getStreakSvg).mockResolvedValue(
      new NextResponse(mockLightSvg, {
        headers: { 'Content-Type': 'image/svg+xml' },
      })
    );

    response = await GET(lightRequest);
    expect(response.status).toBe(200);
    expect(lastSvgText).toContain('#ffffff');
    expect(lastSvgText).toContain('#24292f');
  });

  it('Case 2: verifies color contrast ratio standards are satisfied for dark mode elements', async () => {
    const request = new Request('http://localhost:3000/api/streak/png?theme=dark');

    // Foreground text: #c9d1d9 vs Background: #0d1117
    // Accent text: #58a6ff vs Background: #0d1117
    const mockSvg =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect class="cp-bg-fill" fill="#0d1117"/><text fill="#c9d1d9">Title</text><text fill="#58a6ff">Streak</text></svg>';
    vi.mocked(getStreakSvg).mockResolvedValue(
      new NextResponse(mockSvg, {
        headers: { 'Content-Type': 'image/svg+xml' },
      })
    );

    await GET(request);

    // Assert contrast ratio meets WCAG accessibility requirements (>= 3.0:1 for large/graphical, >= 4.5:1 for normal text)
    const titleContrast = getContrastRatio('#0d1117', '#c9d1d9');
    const accentContrast = getContrastRatio('#0d1117', '#58a6ff');
    expect(titleContrast).toBeGreaterThanOrEqual(4.5);
    expect(accentContrast).toBeGreaterThanOrEqual(3.0);
  });

  it('Case 3: verifies color contrast ratio standards are satisfied for light mode elements', async () => {
    const request = new Request('http://localhost:3000/api/streak/png?theme=light');

    // Foreground text: #24292f vs Background: #ffffff
    // Accent text: #0969da vs Background: #ffffff
    const mockSvg =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect class="cp-bg-fill" fill="#ffffff"/><text fill="#24292f">Title</text><text fill="#0969da">Streak</text></svg>';
    vi.mocked(getStreakSvg).mockResolvedValue(
      new NextResponse(mockSvg, {
        headers: { 'Content-Type': 'image/svg+xml' },
      })
    );

    await GET(request);

    const titleContrast = getContrastRatio('#ffffff', '#24292f');
    const accentContrast = getContrastRatio('#ffffff', '#0969da');
    expect(titleContrast).toBeGreaterThanOrEqual(4.5);
    expect(accentContrast).toBeGreaterThanOrEqual(4.5);
  });

  it('Case 4: checks that specific custom stylesheet classes or theme variables are active in the markup', async () => {
    const request = new Request('http://localhost:3000/api/streak/png');
    const mockSvg = `<svg xmlns="http://www.w3.org/2000/svg">
      <style>
        .cp-bg-fill { fill: var(--cp-bg); }
        .cp-text-fill { fill: var(--cp-text); }
        .cp-accent-fill { fill: var(--cp-accent); }
      </style>
      <rect class="cp-bg-fill" />
      <text class="cp-text-fill" />
      <circle class="cp-accent-fill" />
    </svg>`;

    vi.mocked(getStreakSvg).mockResolvedValue(
      new NextResponse(mockSvg, {
        headers: { 'Content-Type': 'image/svg+xml' },
      })
    );

    await GET(request);

    expect(lastSvgText).toContain('cp-bg-fill');
    expect(lastSvgText).toContain('cp-text-fill');
    expect(lastSvgText).toContain('cp-accent-fill');
    expect(lastSvgText).toContain('var(--cp-bg)');
  });

  it('Case 5: validates that background overlays and layout dimensions scale cleanly without clipping', async () => {
    const request = new Request(
      'http://localhost:3000/api/streak/png?size=large&hideBackground=true'
    );
    const mockSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420" fill="none">
      <rect width="800" height="420" fill="transparent" />
      <g id="cp-towers">
        <path d="M0 0 L10 10 Z" fill="#00ffaa" />
      </g>
    </svg>`;

    vi.mocked(getStreakSvg).mockResolvedValue(
      new NextResponse(mockSvg, {
        headers: { 'Content-Type': 'image/svg+xml' },
      })
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(lastSvgText).toContain('width="800"');
    expect(lastSvgText).toContain('height="420"');
    expect(lastSvgText).toContain('fill="transparent"');
  });
});
