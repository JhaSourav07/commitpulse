import { describe, expectTypeOf, it } from 'vitest';
import type { EditorPanelProps } from './EditorPanel';
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
      showRepoSpotlight: boolean;
      spotlightRepo: string;
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

  it('Test 3: validates EditorPanelProps required properties', () => {
    expectTypeOf<EditorPanelProps>().toHaveProperty('state').toEqualTypeOf<GeneratorState>();
    expectTypeOf<EditorPanelProps>()
      .toHaveProperty('onNameChange')
      .toEqualTypeOf<(v: string) => void>();
    expectTypeOf<EditorPanelProps>()
      .toHaveProperty('onDescriptionChange')
      .toEqualTypeOf<(v: string) => void>();
    expectTypeOf<EditorPanelProps>()
      .toHaveProperty('onTechsChange')
      .toEqualTypeOf<(ids: string[]) => void>();
    expectTypeOf<EditorPanelProps>()
      .toHaveProperty('onSocialsChange')
      .toEqualTypeOf<(ids: string[]) => void>();
    expectTypeOf<EditorPanelProps>()
      .toHaveProperty('onSocialLinkChange')
      .toEqualTypeOf<(id: string, url: string) => void>();
    expectTypeOf<EditorPanelProps>()
      .toHaveProperty('onGithubUsernameChange')
      .toEqualTypeOf<(v: string) => void>();
    expectTypeOf<EditorPanelProps>()
      .toHaveProperty('onShowCommitPulseChange')
      .toEqualTypeOf<(v: boolean) => void>();
    expectTypeOf<EditorPanelProps>()
      .toHaveProperty('onCommitPulseAccentChange')
      .toEqualTypeOf<(v: string) => void>();
    expectTypeOf<EditorPanelProps>()
      .toHaveProperty('onApplyImport')
      .toEqualTypeOf<(data: ImportedData) => void>();
  });

  it('Test 4: validates EditorPanelProps accepts optional values without compile errors', () => {
    // Asserting the optional parameters
    type OptionalProps = Pick<
      EditorPanelProps,
      | 'showSnakeGraph'
      | 'showPacmanGraph'
      | 'graphPlacement'
      | 'onShowSnakeGraphChange'
      | 'onShowPacmanGraphChange'
      | 'onGraphPlacementChange'
      | 'showRepoSpotlight'
      | 'spotlightRepo'
      | 'onShowRepoSpotlightChange'
      | 'onSpotlightRepoChange'
    >;
    expectTypeOf<OptionalProps>().toEqualTypeOf<{
      showSnakeGraph?: boolean;
      showPacmanGraph?: boolean;
      graphPlacement?: 'top' | 'middle' | 'bottom';
      onShowSnakeGraphChange?: (v: boolean) => void;
      onShowPacmanGraphChange?: (v: boolean) => void;
      onGraphPlacementChange?: (v: 'top' | 'middle' | 'bottom') => void;
      showRepoSpotlight?: boolean;
      spotlightRepo?: string;
      onShowRepoSpotlightChange?: (v: boolean) => void;
      onSpotlightRepoChange?: (v: string) => void;
    }>();
  });

  it('Test 5: asserts invalid prop parameters are blocked during static type checking', () => {
    // Testing that a bad type is not assignable to EditorPanelProps
    type InvalidProps = {
      state: 'InvalidType';
      onNameChange: string;
    };
    expectTypeOf<InvalidProps>().not.toMatchTypeOf<EditorPanelProps>();
  });
});
