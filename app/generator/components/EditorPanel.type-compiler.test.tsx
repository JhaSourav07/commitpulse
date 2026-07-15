import { describe, expect, expectTypeOf, it } from 'vitest';
import type { GeneratorState } from '../types';
import type { ImportedData } from '../utils/githubMapper';

describe('EditorPanel Type Compiler Validation', () => {
  it('Test 1: validates GeneratorState structure', () => {
    expectTypeOf<GeneratorState>().toEqualTypeOf<{
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

  it('Test 2: validates ImportedData structure', () => {
    expectTypeOf<ImportedData>().toEqualTypeOf<{
      name: string;
      description: string;
      selectedTechs: string[];
      selectedSocials: string[];
      socialLinks: Record<string, string>;
    }>();
  });

  it('Test 3: validates GeneratorState required field types', () => {
    expectTypeOf<GeneratorState['name']>().toEqualTypeOf<string>();
    expectTypeOf<GeneratorState['description']>().toEqualTypeOf<string>();
    expectTypeOf<GeneratorState['selectedTechs']>().toEqualTypeOf<string[]>();
    expectTypeOf<GeneratorState['selectedSocials']>().toEqualTypeOf<string[]>();
    expectTypeOf<GeneratorState['socialLinks']>().toEqualTypeOf<Record<string, string>>();
    expectTypeOf<GeneratorState['githubUsername']>().toEqualTypeOf<string>();
    expectTypeOf<GeneratorState['showCommitPulse']>().toEqualTypeOf<boolean>();
    expectTypeOf<GeneratorState['commitPulseAccent']>().toEqualTypeOf<string>();
    expectTypeOf<GeneratorState['graphPlacement']>().toEqualTypeOf<'top' | 'middle' | 'bottom'>();
  });

  it('Test 4: verifies custom types accept optional values without compile errors', () => {
    type OptionalState = Partial<GeneratorState>;
    expectTypeOf<OptionalState>().toEqualTypeOf<Partial<GeneratorState>>();

    const partialState: OptionalState = {
      name: 'My Readme',
      githubUsername: 'octocat',
    };
    expect(partialState.name).toBe('My Readme');
    expect(partialState.githubUsername).toBe('octocat');
  });

  it('Test 5: asserts invalid prop parameters are blocked during static type checking', () => {
    expectTypeOf<GeneratorState>().not.toEqualTypeOf<{
      name: number;
      description: number;
      selectedTechs: string;
      selectedSocials: string;
      socialLinks: string[];
      githubUsername: number;
      showCommitPulse: string;
      commitPulseAccent: number;
      showSnakeGraph: string;
      showPacmanGraph: string;
      graphPlacement: string;
    }>();
  });
});
