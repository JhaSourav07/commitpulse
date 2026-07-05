import { describe, expectTypeOf, it } from 'vitest';
import { generateReadme, getEmptyReadme } from './readmeGenerator';
import type { GeneratorState } from '../types';

describe('readmeGenerator Type Compiler Validation', () => {
  it('accepts GeneratorState parameter', () => {
    expectTypeOf(generateReadme).parameters.toEqualTypeOf<[GeneratorState]>();
  });

  it('returns string from generateReadme', () => {
    expectTypeOf(generateReadme).returns.toEqualTypeOf<string>();
  });

  it('returns string from getEmptyReadme', () => {
    expectTypeOf(getEmptyReadme).returns.toEqualTypeOf<string>();
  });

  it('validates GeneratorState structure', () => {
    expectTypeOf<GeneratorState>().toMatchTypeOf<{
      name: string;
      description: string;
      selectedTechs: string[];
      selectedSocials: string[];
      socialLinks: Record<string, string>;
      githubUsername: string;
      showCommitPulse: boolean;
      commitPulseAccent: string;
      showSnakeGraph: boolean;
      showPacmanGraph: boolean;
      graphPlacement: 'top' | 'middle' | 'bottom';
    }>();
  });

  it('maintains exported function signatures', () => {
    expectTypeOf(generateReadme).toBeFunction();
    expectTypeOf(getEmptyReadme).toBeFunction();
  });
});
