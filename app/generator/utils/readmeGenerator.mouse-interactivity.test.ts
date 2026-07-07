import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateReadme, getEmptyReadme } from './readmeGenerator';
import type { GeneratorState } from '../types';

// Mock the async service layer so interactive-element assertions run
// against a stable, deterministic markup structure — the interactive
// pieces of the generated README (tooltips, hover cursors, click links)
// are all built on top of these resolved service records.
vi.mock('../data/technologies', () => ({
  getTechById: vi.fn(),
}));
vi.mock('../data/socials', () => ({
  getSocialById: vi.fn(),
}));

import { getTechById } from '../data/technologies';
import { getSocialById } from '../data/socials';

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

describe('readmeGenerator — Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits a title-based tooltip on every active tech segment so mouseenter/hover gestures reveal the label', () => {
    // Each tech icon must carry a `title="…"` attribute — this is the
    // native browser tooltip that fires on mouseenter/hover across both
    // desktop and touch devices (via long-press).
    (getTechById as ReturnType<typeof vi.fn>).mockImplementation((id: string) => ({
      id,
      name: id.toUpperCase(),
      type: 'simpleicon',
      iconUrl: `https://cdn.simpleicons.org/${id}`,
    }));

    const state = buildState({ selectedTechs: ['react', 'node'] });
    const output = generateReadme(state);

    // Every icon exposes a title tooltip at its computed coordinate.
    const titleCount = (output.match(/title="[^"]+"/g) || []).length;
    expect(titleCount).toBeGreaterThanOrEqual(2);
    expect(output).toContain('title="REACT"');
    expect(output).toContain('title="NODE"');
  });

  it('renders responsive tooltip layouts at computed coordinates for devicon-style tech entries', () => {
    // Devicon entries render via the diImg helper. The tooltip
    // coordinate is computed from the icon size (40x40) — assert both
    // dimensions AND the title attribute so the tooltip is anchored at
    // a predictable position on hover.
    (getTechById as ReturnType<typeof vi.fn>).mockReturnValue({
      id: 'ts',
      name: 'TypeScript',
      type: 'devicon',
      iconUrl: 'https://example.com/ts.svg',
    });

    const state = buildState({ selectedTechs: ['ts'] });
    const output = generateReadme(state);

    expect(output).toContain('title="TypeScript"');
    expect(output).toContain('width="40"');
    expect(output).toContain('height="40"');
    // Alt text is the accessible-name equivalent of the tooltip on
    // screen readers and touch devices that suppress hover.
    expect(output).toContain('alt="TypeScript"');
  });

  it('propagates click/touch gestures cleanly by wrapping every social badge in a target=_blank anchor', () => {
    // Click / touch events must bubble to a resolvable <a> element that
    // opens in a new tab AND declares rel="noopener noreferrer" so the
    // new window cannot hijack window.opener (a real click-hijack risk).
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

    expect(output).toContain('<a href="https://github.com/ada"');
    expect(output).toContain('target="_blank"');
    expect(output).toContain('rel="noopener noreferrer"');
    // The anchor carries the tooltip too, so the hover label appears
    // whether the pointer lands on the <a> or the inner <img>.
    expect(output).toContain('title="GitHub"');
  });

  it('normalizes the email social link into a mailto: gesture so click events launch the correct native handler', () => {
    // Email is a special click target: the anchor must resolve to a
    // mailto: URI so a click / tap opens the OS mail client instead
    // of navigating to an https page.
    (getSocialById as ReturnType<typeof vi.fn>).mockReturnValue({
      id: 'email',
      name: 'Email',
      type: 'devicon',
      iconUrl: 'https://example.com/email.svg',
    });

    const state = buildState({
      selectedSocials: ['email'],
      socialLinks: { email: 'ada@example.com' },
    });

    const output = generateReadme(state);

    expect(output).toContain('href="mailto:ada@example.com"');
    // Anchor still opens in a new context, matching the propagation
    // rules used by the other social gesture targets.
    expect(output).toContain('target="_blank"');
    expect(output).toContain('rel="noopener noreferrer"');
  });

  it('produces a mouseleave-safe fallback layout — the empty-readme reveals no lingering interactive overlays', () => {
    // When the user resets state, the fallback layout must not carry
    // over any interactive overlays (no dangling <a>, <picture>, or
    // title="…" tooltip fragments that would show up on mouseleave
    // from a previous hover).
    const fallback = getEmptyReadme();

    expect(fallback).not.toContain('<a ');
    expect(fallback).not.toContain('title=');
    expect(fallback).not.toContain('<picture');
    // Fallback still renders the safe centered container so any
    // subsequent hover starts from a clean baseline layout.
    expect(fallback).toContain('<div align="center">');
    // Fallback is side-effect free — no service calls that could
    // repaint a stale interactive overlay.
    expect(getTechById).not.toHaveBeenCalled();
    expect(getSocialById).not.toHaveBeenCalled();
  });
});
