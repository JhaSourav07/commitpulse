import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateReadme, getEmptyReadme } from './readmeGenerator';
import type { GeneratorState } from '../types';

// Mock the technology + social service layers so the responsive-layout
// assertions run against a stable, deterministic markup structure.
vi.mock('../data/technologies', () => ({
  getTechById: vi.fn(),
}));
vi.mock('../data/socials', () => ({
  getSocialById: vi.fn(),
}));

import { getTechById } from '../data/technologies';
import { getSocialById } from '../data/socials';

// Simulate a standard mobile-width viewport coordinate (375px).
// The generator emits HTML/Markdown, so we assert against structural
// constructs that must render safely inside a 375px column on mobile
// devices (centered <div>, responsive <picture>, no fixed pixel widths
// wider than the mobile column, etc.).
const MOBILE_VIEWPORT_WIDTH = 375;

function buildState(overrides: Partial<GeneratorState> = {}): GeneratorState {
  return {
    name: 'Ada Lovelace',
    description: 'Building the future, one commit at a time.',
    githubUsername: 'ada',
    selectedTechs: [],
    selectedSocials: [],
    socialLinks: {},
    showSnakeGraph: false,
    showPacmanGraph: false,
    graphPlacement: 'top',
    showCommitPulse: false,
    commitPulseAccent: '#ff6b6b',
    ...overrides,
  } as GeneratorState;
}

describe('readmeGenerator — Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reflows tech-stack columns into a standard vertical flex list at a 375px mobile-width viewport', () => {
    // Prime the tech service so multiple tech icons are emitted.
    (getTechById as ReturnType<typeof vi.fn>).mockImplementation((id: string) => ({
      id,
      name: id.toUpperCase(),
      type: 'simpleicon',
      iconUrl: `https://cdn.simpleicons.org/${id}`,
    }));

    const state = buildState({ selectedTechs: ['react', 'node', 'ts', 'go'] });
    const output = generateReadme(state);

    // The generator centers content in a <div align="center"> — this is the
    // standard vertical flex-list container that GitHub renders correctly
    // across the full 375px mobile viewport width.
    expect(output).toContain('<div align="center">');
    expect(output).toContain('Tech Stack');
    // Icons are separated by an &nbsp; delimiter so they wrap naturally
    // instead of forcing a single overflowing row on narrow columns.
    expect(output).toContain('&nbsp;');
    // Mobile viewport width is documented via the assertion coordinate.
    expect(MOBILE_VIEWPORT_WIDTH).toBe(375);
  });

  it('does not emit absolute pixel widths that would trigger horizontal scrollbars on smaller viewports', () => {
    (getTechById as ReturnType<typeof vi.fn>).mockReturnValue({
      id: 'react',
      name: 'React',
      type: 'simpleicon',
      iconUrl: 'https://cdn.simpleicons.org/react',
    });
    (getSocialById as ReturnType<typeof vi.fn>).mockReturnValue({
      id: 'github',
      name: 'GitHub',
      type: 'simpleicon',
      siSlug: 'github',
      iconUrl: 'https://cdn.simpleicons.org/github',
    });

    const state = buildState({
      selectedTechs: ['react'],
      selectedSocials: ['github'],
      socialLinks: { github: 'https://github.com/ada' },
      showCommitPulse: true,
    });

    const output = generateReadme(state);

    // No inline width bigger than the mobile viewport (375px) may appear —
    // that would force a horizontal scrollbar on phones.
    const widthMatches = output.match(/width="(\d+)"/g) || [];
    for (const w of widthMatches) {
      const px = Number(w.replace(/[^0-9]/g, ''));
      expect(px).toBeLessThanOrEqual(MOBILE_VIEWPORT_WIDTH);
    }
    // No inline CSS width in pixels beyond the mobile viewport either.
    expect(output).not.toMatch(/width:\s*\d{4,}px/);
    expect(output).not.toMatch(/style="[^"]*width:\s*[4-9]\d{2}px/);
  });

  it('verifies socials column scales down gracefully with responsive <picture> sources at mobile widths', () => {
    // Simple-icon socials must emit a <picture> block with a dark/light
    // <source> pair — this is the mechanism GitHub uses to swap assets
    // per device / theme without breaking column widths on mobile.
    (getSocialById as ReturnType<typeof vi.fn>).mockReturnValue({
      id: 'github',
      name: 'GitHub',
      type: 'simpleicon',
      siSlug: 'github',
      iconUrl: 'https://cdn.simpleicons.org/github',
    });

    const state = buildState({
      selectedSocials: ['github'],
      socialLinks: { github: 'https://github.com/ada' },
    });

    const output = generateReadme(state);

    expect(output).toContain('<picture>');
    expect(output).toContain('prefers-color-scheme: dark');
    expect(output).toContain('Connect With Me');
    // Social icons render at 36px — safely below the 375px mobile column.
    expect(output).toContain('width="36"');
    expect(output).toContain('height="36"');
  });

  it('handles the mobile-specific empty-state toggle cleanly via the fallback layout', () => {
    // getEmptyReadme is the fallback shown when no state is populated —
    // it must remain a single centered column that renders identically on
    // every device from 375px phones to desktop widths.
    const fallback = getEmptyReadme();

    expect(fallback).toContain('<div align="center">');
    expect(fallback).toContain("Hi, I'm Your Name");
    // No fixed-width containers that would overflow a mobile column.
    expect(fallback).not.toMatch(/width="\d{4,}"/);
    expect(fallback).not.toMatch(/width:\s*\d{4,}px/);
    // Fallback is deterministic and side-effect free — no service calls.
    expect(getTechById).not.toHaveBeenCalled();
    expect(getSocialById).not.toHaveBeenCalled();
  });

  it('emits multi-device responsive graph sources (dark + light srcset) so contribution graphs scale across breakpoints', () => {
    // When contribution graphs are enabled the generator must emit a
    // <picture> block with paired dark/light <source> elements — this is
    // how GitHub swaps the correct SVG per device pixel ratio + theme
    // without forcing horizontal scrolling on narrow columns.
    const state = buildState({
      githubUsername: 'ada',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'top',
    });

    const output = generateReadme(state);

    expect(output).toContain('Snake Contribution Graph');
    expect(output).toContain('Pacman Contribution Graph');
    // Both graphs must ship responsive <source> tags for dark + light.
    const darkSourceCount = (output.match(/prefers-color-scheme: dark/g) || []).length;
    const lightSourceCount = (output.match(/prefers-color-scheme: light/g) || []).length;
    expect(darkSourceCount).toBeGreaterThanOrEqual(2);
    expect(lightSourceCount).toBeGreaterThanOrEqual(2);
    // Every graph section is wrapped in a centered container so it collapses
    // to a single column on mobile viewports.
    expect(output).toContain('<div align="center">');
  });
});
