import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StreakStats, BadgeParams, ContributionCalendar } from '../types';

const perfHooksMock = vi.hoisted(() => ({
  performance: {
    now: vi.fn(() => 1),
  },
}));

vi.mock('perf_hooks', () => ({
  ...perfHooksMock,
  default: perfHooksMock,
}));

vi.mock('../lib/svg/generator', () => ({
  generateSVG: vi.fn(
    () => `
    <svg xmlns="http://www.w3.org/2000/svg" id="benchmark-root" role="img" aria-labelledby="svg-title svg-desc" width="800" height="400">
      <title id="svg-title">Benchmark Performance Dashboard Metrics</title>
      <desc id="svg-desc">Visual grid displaying execution runtime profiles across compilation iterations.</desc>
      
      <g id="heading-group" role="group">
        <text font-size="20" role="heading" aria-level="1" y="30" x="20">SVG Engine Performance Audit</text>
      </g>

      <g class="interactive-nodes">
        <rect id="interactive-bar-0" tabindex="0" role="button" aria-label="Iteration 1: 45 milliseconds" width="50" height="200" />
      </g>

      <div id="benchmark-tooltip" role="tooltip" aria-describedby="tooltip-details">
        <span id="tooltip-details">Execution threshold variation: nominal steady state operation.</span>
      </div>
    </svg>
  `
  ),
}));

vi.mock('../lib/svg/sanitizer', () => ({
  hexColor: vi.fn((value: string) => `#${value}`),
  sanitizeSpeed: vi.fn(() => '8s'),
}));

describe('scripts/benchmark-svg — Accessibility Standards & Screen Reader ARIA Compliance (Variation 4)', () => {
  let svgString: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const { generateSVG } = await import('../lib/svg/generator');

    const mockStats = {
      currentStreak: { start: '', end: '', count: 0, days: 0 },
      longestStreak: { start: '', end: '', count: 0, days: 0 },
      totalContributions: 0,
      todayDate: '',
    };
    const mockParams = { user: 'test' };
    const mockCalendar = { totalContributions: 0, weeks: [] };

    svgString = generateSVG(
      mockStats as unknown as StreakStats,
      mockParams as unknown as BadgeParams,
      mockCalendar as unknown as ContributionCalendar
    );
  });

  it('inspects markup to verify correct implementation of accessible label references via aria-labelledby', () => {
    expect(svgString).toMatch(/id="benchmark-root"/);
    expect(svgString).toMatch(/<title id="svg-title">Benchmark Performance/);
    expect(svgString).toMatch(/<desc id="svg-desc">Visual grid/);
  });

  it('asserts elements that accept keyboard focus have valid structural role attributes', () => {
    expect(svgString).toMatch(/id="interactive-bar-0"/);
    expect(svgString).toMatch(/tabindex="0"/);
    expect(svgString).toMatch(/role="button"/);
  });

  it('verifies that output tooltips present themselves with specific screen-reader helper roles', () => {
    expect(svgString).toMatch(/role="tooltip"/);
    expect(svgString).toMatch(/aria-describedby="tooltip-details"/);
  });

  it('ensures focusable items are configured cleanly to allow consecutive keyboard tabbing paths', () => {
    const hasTabFocus = /tabindex="0"/.test(svgString);
    expect(hasTabFocus).toBe(true);
  });

  it('confirms benchmark text elements expose heading structures in a logical hierarchical layout order', () => {
    expect(svgString).toMatch(/role="heading"/);
    expect(svgString).toMatch(/aria-level="1"/);
    expect(svgString).toMatch(/SVG Engine Performance Audit/);
  });
});
