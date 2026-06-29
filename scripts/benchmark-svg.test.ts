import { beforeEach, describe, expect, it, vi } from 'vitest';

const perfHooksMock = vi.hoisted(() => ({
  performance: {
    now: vi.fn(),
  },
}));

vi.mock('../lib/svg/generator', () => ({
  generateSVG: vi.fn(() => '<svg/>'),
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

describe('scripts/benchmark-svg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prints the benchmark header', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { performance } = await import('perf_hooks');
    vi.mocked(performance.now).mockImplementation(() => 1);

    await runBenchmarkScript();

    expect(logSpy).toHaveBeenCalledWith('\nSVG Benchmark Results\n');
  });

  it('runs warmup plus 20 timed iterations for each theme', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { performance } = await import('perf_hooks');
    const { generateSVG } = await import('../lib/svg/generator');

    let tick = 0;
    vi.mocked(performance.now).mockImplementation(() => {
      tick += 1;
      return tick;
    });

    await runBenchmarkScript();

    expect(generateSVG).toHaveBeenCalledTimes(63);
    expect(vi.mocked(generateSVG).mock.calls[0]?.[1]).toMatchObject({
      bg: '#0d1117',
      accent: '#00ffaa',
      text: '#ffffff',
    });
    expect(logSpy).toHaveBeenCalled();
  });

  it('logs all theme names', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { performance } = await import('perf_hooks');
    vi.mocked(performance.now).mockImplementation(() => 1);

    await runBenchmarkScript();

    expect(logSpy).toHaveBeenCalledWith('Theme: dark');
    expect(logSpy).toHaveBeenCalledWith('Theme: light');
    expect(logSpy).toHaveBeenCalledWith('Theme: purple');
  });

  it('formats floating-point benchmark numbers to 2 decimals', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { performance } = await import('perf_hooks');

    let call = 0;
    vi.mocked(performance.now).mockImplementation(() => {
      call += 1;
      if (call % 2 === 1) return call;
      return call + 1.2345;
    });

    await runBenchmarkScript();

    const lines = logSpy.mock.calls
      .map((args) => String(args[0]))
      .filter(
        (line) =>
          line.startsWith('Average:') ||
          line.startsWith('P50:') ||
          line.startsWith('P95:') ||
          line.startsWith('P99:') ||
          line.startsWith('Min:') ||
          line.startsWith('Max:')
      );

    expect(lines.length).toBe(18);
    for (const line of lines) {
      expect(line).toMatch(/:\s\d+\.\d{2}ms$/);
    }
  });

  it('correctly calculates and logs percentiles (P50/P95/P99)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { performance } = await import('perf_hooks');

    let callIndex = 0;
    const differences = Array.from({ length: 20 }, (_, i) => i + 1);

    vi.mocked(performance.now).mockImplementation(() => {
      const themeCallIndex = callIndex % 40;
      callIndex += 1;

      const iterIndex = Math.floor(themeCallIndex / 2);
      const isEnd = themeCallIndex % 2 === 1;

      if (!isEnd) {
        return iterIndex * 100;
      } else {
        return iterIndex * 100 + differences[iterIndex];
      }
    });

    await runBenchmarkScript();

    expect(logSpy).toHaveBeenCalledWith('P50: 10.50ms');
    expect(logSpy).toHaveBeenCalledWith('P95: 19.05ms');
    expect(logSpy).toHaveBeenCalledWith('P99: 19.81ms');
  });

  it('prints separator line after each theme block', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { performance } = await import('perf_hooks');
    vi.mocked(performance.now).mockImplementation(() => 1);

    await runBenchmarkScript();

    const separatorCalls = logSpy.mock.calls.filter(
      (args) => args[0] === '--------------------------'
    );
    expect(separatorCalls).toHaveLength(3);
  });

  it('respects --iterations=N parameter', async () => {
    const originalArgv = [...process.argv];
    process.argv = [...originalArgv, '--iterations=5'];

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { performance } = await import('perf_hooks');
    const { generateSVG } = await import('../lib/svg/generator');

    let tick = 0;
    vi.mocked(performance.now).mockImplementation(() => {
      tick += 1;
      return tick;
    });

    try {
      await runBenchmarkScript();
      // warmup (1) + iterations (5) = 6 calls per theme
      // 3 themes * 6 = 18 calls total
      expect(generateSVG).toHaveBeenCalledTimes(18);
    } finally {
      process.argv = originalArgv;
    }
  });

  it('falls back to 20 iterations for invalid --iterations values', async () => {
    const originalArgv = [...process.argv];
    process.argv = [...originalArgv, '--iterations=-10'];

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { performance } = await import('perf_hooks');
    const { generateSVG } = await import('../lib/svg/generator');

    let tick = 0;
    vi.mocked(performance.now).mockImplementation(() => {
      tick += 1;
      return tick;
    });

    try {
      await runBenchmarkScript();
      // warmup (1) + default iterations (20) = 21 calls per theme
      // 3 themes * 21 = 63 calls total
      expect(generateSVG).toHaveBeenCalledTimes(63);
    } finally {
      process.argv = originalArgv;
    }
  });
});
