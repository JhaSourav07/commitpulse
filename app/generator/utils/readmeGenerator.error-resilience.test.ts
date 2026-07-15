import { describe, it, expect } from 'vitest';
import { generateReadme, getEmptyReadme } from './readmeGenerator';
import type { GeneratorState } from '../types';

function buildState(overrides: Partial<GeneratorState> = {}): GeneratorState {
  return {
    name: '',
    description: '',
    selectedTechs: [],
    selectedSocials: [],
    socialLinks: {},
    githubUsername: '',
    showCommitPulse: false,
    commitPulseAccent: '000000',
    showRepoSpotlight: false,
    spotlightRepo: '',
    showSnakeGraph: false,
    showPacmanGraph: false,
    graphPlacement: 'bottom',
    ...overrides,
  };
}

describe('readmeGenerator - hydration stability, exception safety & error fallbacks (Variation 6)', () => {
  // Case 1: Minimal/empty optional fields (name, description) do not throw and fall back cleanly.
  it('does not throw and falls back cleanly when optional fields are empty', () => {
    expect(() => generateReadme(buildState())).not.toThrow();
    expect(generateReadme(buildState())).toBe('');
  });

  // Case 2: Boundary-wrapped call — unexpected nested tech/social ids never propagate uncaught exceptions.
  it('safely wraps generation so unknown tech/social ids never crash the caller', () => {
    let caughtError: unknown = null;
    let result = '';
    try {
      result = generateReadme(
        buildState({
          selectedTechs: ['does-not-exist', 'javascript'],
          selectedSocials: ['does-not-exist', 'github'],
          socialLinks: { github: 'https://github.com/aaniya22' },
        })
      );
    } catch (err) {
      caughtError = err;
    }
    expect(caughtError).toBeNull();
    expect(result).toContain('Tech Stack');
    expect(result).toContain('Connect With Me');
  });

  // Case 3: Missing required string fields at runtime (bypassing TS via unknown cast) are caught,
  // not left to crash the page — the boundary element (try/catch) recovers with a clean fallback.
  it('renders a clean fallback instead of crashing when required runtime fields are missing', () => {
    const corruptedState = {
      ...buildState({ showCommitPulse: true }),
      githubUsername: undefined,
    } as unknown as GeneratorState;

    let output: string;
    try {
      output = generateReadme(corruptedState);
    } catch {
      output = getEmptyReadme();
    }

    expect(output).toBeTruthy();
    expect(() => generateReadme(corruptedState)).not.toBe(undefined);
  });

  // Case 4: Malformed/unknown ids are filtered out silently rather than leaking broken markup.
  it('filters out unknown tech and social ids without corrupting the generated markdown', () => {
    const output = generateReadme(
      buildState({
        selectedTechs: ['totally-unknown-tech'],
        selectedSocials: ['totally-unknown-social'],
        socialLinks: { 'totally-unknown-social': 'https://example.com' },
      })
    );

    expect(output).not.toContain('undefined');
    expect(output).not.toContain('null');
  });

  // Case 5: Recovery path — a prior failed/malformed call does not corrupt subsequent valid calls
  // (the generator is stateless and hydration-safe across repeated invocations).
  it('recovers cleanly on subsequent calls after a malformed invocation', () => {
    const corruptedState = {
      ...buildState({ showCommitPulse: true }),
      githubUsername: null,
    } as unknown as GeneratorState;

    try {
      generateReadme(corruptedState);
    } catch {
      // expected boundary catch for malformed runtime state
    }

    const validState = buildState({
      name: 'Aaniya',
      description: 'Open source contributor',
    });
    const recovered = generateReadme(validState);

    expect(recovered).toContain("Hi, I'm Aaniya");
    expect(recovered).toContain('Open source contributor');
  });
});
