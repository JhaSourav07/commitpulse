import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';

describe('Integration Test: API Streak Scale Parameter Group', () => {
  beforeEach(() => {
    // 1. Safely stub the environment variables
    vi.stubEnv('GITHUB_TOKEN', 'mock_test_token_123');
    vi.stubEnv('GITHUB_PAT', 'mock_test_token_123');

    // 2. Intercept the network request and return a true native Web Response
    // We mix low and high counts to ensure log vs linear output drastically differs.
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string | URL) => {
        const urlStr = url.toString();
        if (urlStr.includes('graphql')) {
          const mockBody = JSON.stringify({
            data: {
              user: {
                contributionsCollection: {
                  contributionCalendar: {
                    totalContributions: 105,
                    weeks: [
                      {
                        contributionDays: [
                          { contributionCount: 5, date: '2026-01-01' },
                          { contributionCount: 100, date: '2026-01-02' },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          });
          return Promise.resolve(
            new Response(mockBody, {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        } else {
          // Mock REST API profile
          const mockBody = JSON.stringify({
            login: 'JhaSourav07',
            name: 'Sourav Jha',
            avatar_url: 'https://github.com/JhaSourav07.png',
          });
          return Promise.resolve(
            new Response(mockBody, {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }
      })
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('Test 1: should return 200 OK for valid scale=log', async () => {
    const req = new Request('http://localhost/api/streak?user=JhaSourav07&scale=log');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('Test 2: should return 200 OK for valid scale=linear', async () => {
    const req = new Request('http://localhost/api/streak?user=JhaSourav07&scale=linear');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('Test 3: should render different SVGs for linear vs log scaling', async () => {
    const reqLinear = new Request('http://localhost/api/streak?user=JhaSourav07&scale=linear');
    const resLinear = await GET(reqLinear);
    const svgLinear = await resLinear.text();

    const reqLog = new Request('http://localhost/api/streak?user=JhaSourav07&scale=log');
    const resLog = await GET(reqLog);
    const svgLog = await resLog.text();

    // The rendered dimensions/coordinates of rects will differ based on the scaling formula
    expect(svgLinear).not.toEqual(svgLog);

    // We expect valid SVG structure for both
    expect(svgLinear).toContain('</svg>');
    expect(svgLog).toContain('</svg>');
  });

  it('Test 4: should fallback gracefully to linear behavior for invalid scale inputs', async () => {
    const reqInvalid = new Request(
      'http://localhost/api/streak?user=JhaSourav07&scale=unknown_scale_value'
    );
    const resInvalid = await GET(reqInvalid);
    const svgInvalid = await resInvalid.text();

    const reqLinear = new Request('http://localhost/api/streak?user=JhaSourav07&scale=linear');
    const resLinear = await GET(reqLinear);
    const svgLinear = await resLinear.text();

    // The fallback should perfectly match linear behavior
    expect(resInvalid.status).toBe(200);
    expect(svgInvalid).toEqual(svgLinear);
  });

  it('Test 5: should return appropriate HTTP headers for SVG rendering', async () => {
    const req = new Request('http://localhost/api/streak?user=JhaSourav07&scale=log');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/image\/svg\+xml/);
    expect(res.headers.get('Cache-Control')).toBeDefined();
  });
});
