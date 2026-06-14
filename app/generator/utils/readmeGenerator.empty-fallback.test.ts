import { describe, it, expect } from 'vitest';
import { generateReadme, getEmptyReadme } from './readmeGenerator';
import type { GeneratorState } from '../types';

// A baseline "empty" state used as the starting point for every test below.
// Each test overrides only the fields relevant to the edge case being verified,
// keeping the assertions focused and the intent explicit.
const emptyState: GeneratorState = {
  name: '',
  description: '',
  selectedTechs: [],
  selectedSocials: [],
  socialLinks: {},
  githubUsername: '',
  showCommitPulse: false,
  commitPulseAccent: '',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
};

describe('readmeGenerator - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('1. returns an empty string when every input field is empty or falsy', () => {
    // With no name, description, techs, socials, or username, the generator
    // should produce no sections at all — not throw and not return placeholder text.
    const md = generateReadme(emptyState);
    expect(md).toBe('');
  });

  it('2. renders a description-only header when name is missing', () => {
    // The header branch falls through to the `else if (state.description)` path,
    // producing a centered <p> block without the "Hi, I'm ..." heading.
    const md = generateReadme({ ...emptyState, description: 'Just a tagline' });
    expect(md).toContain('<p>Just a tagline</p>');
    expect(md).not.toContain("# 👋 Hi, I'm");
  });

  it('3. skips contribution graphs when githubUsername is empty or whitespace', () => {
    // buildGraphsMarkdown short-circuits to null when the username is blank,
    // so even with both graph toggles enabled no graph markdown is injected.
    const md = generateReadme({
      ...emptyState,
      name: 'Tester',
      githubUsername: '   ',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'top',
    });
    expect(md).not.toContain('Snake Contribution Graph');
    expect(md).not.toContain('Pacman Contribution Graph');
  });

  it('4. omits the CommitPulse badge when showCommitPulse is true but username is empty', () => {
    // Guards on the badge section require a non-empty trimmed username;
    // an empty username must not produce a broken badge URL.
    const md = generateReadme({
      ...emptyState,
      name: 'Tester',
      showCommitPulse: true,
      githubUsername: '',
    });
    expect(md).not.toContain('## 📊 GitHub Streak');
    expect(md).not.toContain('api/streak');
  });

  it('5. skips the socials section when socialLinks contain only empty or whitespace values', () => {
    // activeSocials filters out entries whose link is missing or whitespace-only,
    // so the "Connect With Me" section must not be rendered.
    const md = generateReadme({
      ...emptyState,
      name: 'Tester',
      selectedSocials: ['github', 'twitter'],
      socialLinks: { github: '   ', twitter: '' },
    });
    expect(md).not.toContain('## 🌐 Connect With Me');
  });

  it('6. builds the badge URL without an accent param when commitPulseAccent is invalid', () => {
    // The hex regex inside buildBadgeUrl rejects non-6-char hex strings,
    // so the resulting URL should contain the user param but no accent param.
    const md = generateReadme({
      ...emptyState,
      name: 'Tester',
      githubUsername: 'tester',
      showCommitPulse: true,
      commitPulseAccent: 'not-a-hex',
    });
    expect(md).toContain('user=tester');
    expect(md).not.toContain('accent=');
  });

  it('7. getEmptyReadme returns a non-empty placeholder template string', () => {
    // The fallback used by the UI when no state is configured yet must always
    // return a renderable markdown block containing the placeholder name.
    const md = getEmptyReadme();
    expect(md).toContain("# 👋 Hi, I'm Your Name");
    expect(md).toContain('<p>Your description goes here...</p>');
  });
});
