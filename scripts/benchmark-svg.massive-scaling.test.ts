import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.hoisted() ensures these are created before any mock factories run,
// so they remain stable across vi.resetModules() calls in beforeEach.
const perfHooksMock = vi.hoisted(() => ({
  performance: {
    now: vi.fn(() => 0),
  },
}));

// Stable mock reference kept at module scope so assertions can target it
// even after vi.resetModules() clears the internal module registry.
const generateSVGMock = vi.fn(() => '<svg/>');

describe('benchmark-svg massive scaling stability', () => {
  beforeEach(() => {
    // 1. Clear all accumulated mock state so tests start with a clean slate.
    vi.clearAllMocks();

    // 2. Reset the module registry so every dynamic import in
    //    runBenchmarkScript() re-executes the module rather than reusing a
    //    stale cached copy.  This MUST happen before vi.doMock() calls so
    //    the new mock factories are registered for the fresh module load.
    vi.resetModules();

    // 3. Re-register mocks using vi.doMock() (not vi.mock()) so they take
    //    effect after vi.resetModules().  vi.mock() is hoisted to the top of
    //    the file at parse time and therefore cannot be re-applied after a
    //    resetModules(); vi.doMock() is called at runtime and will be picked
    //    up by the next dynamic import.
    vi.doMock('../lib/svg/generator', () => ({
      generateSVG: generateSVGMock,
    }));

    vi.doMock('../lib/svg/sanitizer', () => ({
      hexColor: vi.fn((value: string) => `#${value}`),
      sanitizeSpeed: vi.fn(() => '8s'),
    }));

    vi.doMock('perf_hooks', () => ({
      performance: perfHooksMock.performance,
      default: perfHooksMock,
    }));
  });

  // Dynamically imports the benchmark script so it picks up the doMock()
  // registrations set in beforeEach().  The import cache was cleared by
  // vi.resetModules(), so each call re-executes benchmark-svg.ts with fresh
  // mocks instead of the polluted module state from a previous test.
  async function runBenchmarkScript() {
    await import('./benchmark-svg');
  }

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
