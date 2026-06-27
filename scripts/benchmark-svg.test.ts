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
        (line) => line.startsWith('Average:') || line.startsWith('Min:') || line.startsWith('Max:')
      );

    expect(lines.length).toBe(9);
    for (const line of lines) {
      expect(line).toMatch(/:\s\d+\.\d{2}ms$/);
    }
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
});
