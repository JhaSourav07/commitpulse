import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aggregateLanguages } from './github';
import { LANGUAGE_COLORS } from './svg/languageColors';
import { contrastRatio, relativeLuminance } from './svg/themes/test-utils';

/** Dashboard presets aligned with CommitPulse dark/light surfaces */
const DASHBOARD_THEMES = {
  dark: { bg: '0f172a', text: 'f8fafc', overlay: '0b0f19' },
  light: { bg: 'ffffff', text: '0f172a', overlay: 'f1f5f9' },
} as const;

/** Graph node colors produced by getFullDashboardData in github.ts */
const GRAPH_NODE_COLORS = {
  user: 'E2E8F0',
  repo: '3B82F6',
  fork: 'F97316',
  contribution: '22C55E',
} as const;

const LANGUAGE_FALLBACK = 'a855f7';

const GRAPH_TAILWIND_CLASSES = [
  'text-slate-200',
  'dark:text-slate-200',
  'text-blue-500',
  'dark:text-blue-400',
  'text-orange-500',
  'dark:text-orange-400',
  'text-green-500',
  'dark:text-green-400',
] as const;

function mockColorScheme(theme: 'light' | 'dark') {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes(theme),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function stripHash(color: string): string {
  return color.replace(/^#/, '');
}

describe('GitHub lib - Dark & Light Prefers-Color-Scheme Visual Cohesion', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('sets up dual theme environment mocks for dark and light prefers-color-scheme presets', () => {
    mockColorScheme('light');
    expect(window.matchMedia('(prefers-color-scheme: light)').matches).toBe(true);
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false);

    mockColorScheme('dark');
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
    expect(window.matchMedia('(prefers-color-scheme: light)').matches).toBe(false);

    expect(DASHBOARD_THEMES.dark.bg).not.toBe(DASHBOARD_THEMES.light.bg);
  });

  it('adapts aggregateLanguages output colors for both dark and light dashboard surfaces', () => {
    const repos = [{ language: 'TypeScript' }, { language: 'JavaScript' }, { language: 'Rust' }];
    const languages = aggregateLanguages(repos);

    expect(languages).toHaveLength(3);
    for (const lang of languages) {
      expect(lang.color).toBe(LANGUAGE_COLORS[lang.name] ?? `#${LANGUAGE_FALLBACK}`);
    }

    mockColorScheme('dark');
    const darkLum = relativeLuminance(DASHBOARD_THEMES.dark.bg);
    mockColorScheme('light');
    const lightLum = relativeLuminance(DASHBOARD_THEMES.light.bg);
    expect(darkLum).toBeLessThan(lightLum);
  });

  it('satisfies WCAG AA contrast (≥ 4.5) for dashboard text on both theme backgrounds', () => {
    const darkRatio = contrastRatio(DASHBOARD_THEMES.dark.bg, DASHBOARD_THEMES.dark.text);
    const lightRatio = contrastRatio(DASHBOARD_THEMES.light.bg, DASHBOARD_THEMES.light.text);

    expect(darkRatio).toBeGreaterThanOrEqual(4.5);
    expect(lightRatio).toBeGreaterThanOrEqual(4.5);

    const fallbackRatio = contrastRatio(DASHBOARD_THEMES.dark.bg, LANGUAGE_FALLBACK);
    expect(fallbackRatio).toBeGreaterThanOrEqual(3);
  });

  it('maps graph node hex colors to active dark/light Tailwind class tokens', () => {
    const hexToTailwind: Record<string, string> = {
      [GRAPH_NODE_COLORS.user]: 'text-slate-200',
      [GRAPH_NODE_COLORS.repo]: 'text-blue-500',
      [GRAPH_NODE_COLORS.fork]: 'text-orange-500',
      [GRAPH_NODE_COLORS.contribution]: 'text-green-500',
    };

    for (const color of Object.values(GRAPH_NODE_COLORS)) {
      const mappedClass = hexToTailwind[color];
      expect(mappedClass).toBeDefined();
      expect(GRAPH_TAILWIND_CLASSES).toContain(mappedClass);
      expect(GRAPH_TAILWIND_CLASSES).toContain(
        mappedClass.replace('text-', 'dark:text-').replace('500', '400')
      );
    }

    const unknownLang = aggregateLanguages([{ language: 'UnknownLangXYZ' }])[0];
    expect(stripHash(unknownLang.color)).toBe(LANGUAGE_FALLBACK);
  });

  it('keeps overlay surfaces from clipping or colliding with foreground graph node colors', () => {
    const overlayOpacity = 0.85;

    for (const theme of ['dark', 'light'] as const) {
      const { bg, overlay } = DASHBOARD_THEMES[theme];
      expect(overlay).not.toBe(bg);
      expect(relativeLuminance(overlay)).toBeGreaterThan(0);
    }

    for (const nodeColor of Object.values(GRAPH_NODE_COLORS)) {
      expect(nodeColor).not.toBe(DASHBOARD_THEMES.dark.bg);
      expect(nodeColor).not.toBe(DASHBOARD_THEMES.light.bg);
      expect(contrastRatio(DASHBOARD_THEMES.dark.bg, nodeColor)).toBeGreaterThan(1);
    }

    expect(overlayOpacity).toBeLessThan(1);
  });
});
