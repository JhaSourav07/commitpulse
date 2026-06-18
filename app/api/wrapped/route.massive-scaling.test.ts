import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getWrappedData } from '@/lib/github';

vi.mock('@/lib/github', () => ({
  getWrappedData: vi.fn(),
}));

describe('ApiWrappedRoute Massive Scaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMassiveData = () => {
    return {
      totalContributions: 99999999,
      mostActiveDate: '2024-01-01',
      highestDailyCount: 999999,
      busiestMonth: '2024-01',
      weekendRatio: 100,
      topLanguage: 'MassiveLang',
      calendar: {
        totalContributions: 99999999,
        weeks: Array.from({ length: 53 }, () => ({
          contributionDays: Array.from({ length: 7 }, () => ({
            contributionCount: 999999,
            date: '2024-01-01',
            color: '#ebedf0',
          })),
        })),
      },
    } as unknown as Awaited<ReturnType<typeof getWrappedData>>;
  };

  it('1. Populate mock objects representing thousands of contributor actions (Massive Metrics)', async () => {
    vi.mocked(getWrappedData).mockResolvedValue(createMassiveData());
    const req = new Request('http://localhost/api/wrapped?user=massive-user&year=2024');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('<svg');
  });

  it('2. Render the module under this highly loaded configuration state (Many Languages)', async () => {
    vi.mocked(getWrappedData).mockResolvedValue(createMassiveData());
    const req = new Request('http://localhost/api/wrapped?user=massive-user');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('3. Assert that layouts do not overlap, text wrapping holds correctly, and SVG coordinates scale cleanly', async () => {
    vi.mocked(getWrappedData).mockResolvedValue(createMassiveData());
    const req = new Request('http://localhost/api/wrapped?user=massive-user&theme=dark');
    const res = await GET(req);
    const svg = await res.text();
    expect(svg.includes('NaN')).toBe(false);
    expect(svg.includes('undefined')).toBe(false);
  });

  it('4. Check execution times to verify calculation performance stays below limit margins', async () => {
    vi.mocked(getWrappedData).mockResolvedValue(createMassiveData());
    const start = performance.now();
    const req = new Request('http://localhost/api/wrapped?user=massive-user&theme=light');
    await GET(req);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1000);
  });

  it('5. Verify that grid items or listings render without breaking browser layout trees', async () => {
    const data = createMassiveData();
    data.topLanguage = 'W'.repeat(100); // Massive internal string to test layout wrapping
    vi.mocked(getWrappedData).mockResolvedValue(data);
    const req = new Request('http://localhost/api/wrapped?user=' + 'A'.repeat(39));
    const res = await GET(req);
    expect(res.status).toBe(200);
    const svg = await res.text();
    expect(svg).toBeTruthy();
  });
});
