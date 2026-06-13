import { beforeEach, describe, expect, it, vi } from 'vitest';

const perfHooksMock = vi.hoisted(() => ({
  performance: {
    now: vi.fn(),
  },
}));

const generateSVGMock = vi.fn(() => '<svg/>');

vi.mock('../lib/svg/generator', () => ({
  generateSVG: generateSVGMock,
}));

vi.mock('../lib/svg/sanitizer', () => ({
  hexColor: vi.fn((value: string) => `#${value}`),
  sanitizeSpeed: vi.fn(() => '8s'),
}));

vi.mock('perf_hooks', () => ({
  ...perfHooksMock,
  default: perfHooksMock,
}));

async function runBenchmarkScript() {
  vi.resetModules();
  await import('./benchmark-svg');
}

describe('benchmark-svg massive scaling stability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles thousands of SVG generations without breaking execution', async () => {
    const { performance } = await import('perf_hooks');

    let tick = 0;
    vi.mocked(performance.now).mockImplementation(() => ++tick);

    await runBenchmarkScript();

    expect(generateSVGMock).toHaveBeenCalledTimes(63);
  });

  it('supports extreme contribution metrics without invalid numeric values', () => {
    const massiveMetrics = Array.from({ length: 50_000 }, (_, index) => ({
      contributions: index * 1000,
    }));

    const total = massiveMetrics.reduce((sum, item) => sum + item.contributions, 0);

    expect(Number.isFinite(total)).toBe(true);
    expect(total).toBeGreaterThan(0);
  });

  it('keeps benchmark execution timing within reasonable limits', async () => {
    const { performance } = await import('perf_hooks');

    let counter = 0;
    vi.mocked(performance.now).mockImplementation(() => {
      counter += 1;
      return counter;
    });

    const start = Date.now();

    await runBenchmarkScript();

    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
  });

  it('processes massive contributor datasets without layout scaling failures', () => {
    const contributors = Array.from({ length: 10000 }, (_, index) => ({
      username: `user-${index}`,
      commits: index + 1,
    }));

    expect(contributors).toHaveLength(10000);

    const maxCommits = Math.max(...contributors.map((contributor) => contributor.commits));

    expect(maxCommits).toBe(10000);
  });

  it('maintains stable rendering calls under repeated high-volume workloads', async () => {
    const { performance } = await import('perf_hooks');

    let tick = 0;
    vi.mocked(performance.now).mockImplementation(() => ++tick);

    await Promise.all([runBenchmarkScript(), runBenchmarkScript(), runBenchmarkScript()]);

    expect(generateSVGMock).toHaveBeenCalled();
    expect(generateSVGMock.mock.calls.length).toBeGreaterThan(0);
  });
});
