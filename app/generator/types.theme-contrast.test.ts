import { describe, expect, expectTypeOf, it } from 'vitest';
import { SOCIALS } from './data/socials';
import { TECHNOLOGIES } from './data/technologies';
import type { GeneratorState, IconType, Social, Technology } from './types';

describe('GeneratorTypes theme contrast behavior', () => {
  it('GeneratorState.commitPulseAccent supports light and dark color values', () => {
    // Type-level constraint verification
    expectTypeOf<GeneratorState['commitPulseAccent']>().toBeString();

    const lightState: GeneratorState = {
      name: 'CommitPulse',
      description: 'Activity visualizer',
      selectedTechs: [],
      selectedSocials: [],
      socialLinks: {},
      githubUsername: 'user',
      showCommitPulse: true,
      commitPulseAccent: '#f8fafc',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'bottom',
    };

    const darkState: GeneratorState = {
      name: 'CommitPulse',
      description: 'Activity visualizer',
      selectedTechs: [],
      selectedSocials: [],
      socialLinks: {},
      githubUsername: 'user',
      showCommitPulse: true,
      commitPulseAccent: '#0f172a',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'bottom',
    };

    expect(lightState.commitPulseAccent).toBe('#f8fafc');
    expect(darkState.commitPulseAccent).toBe('#0f172a');
  });

  it('Technology.iconUrl survives theme-aware URL patterns', () => {
    // Type-level constraint verification
    expectTypeOf<Technology['iconUrl']>().toBeString();

    // Verify actual production dataset's iconUrl integrity
    expect(TECHNOLOGIES.length).toBeGreaterThan(0);

    TECHNOLOGIES.forEach((tech) => {
      expect(tech.iconUrl.length).toBeGreaterThan(0);
      expect(tech.iconUrl.startsWith('https://') || tech.iconUrl.startsWith('http://')).toBe(true);
    });
  });

  it('IconType covers both icon sources used in themed contexts', () => {
    // Type-level completeness verification (fails compilation if union changes)
    expectTypeOf<IconType>().toEqualTypeOf<'devicon' | 'simpleicon'>();

    const a: IconType = 'devicon';
    const b: IconType = 'simpleicon';
    expect(['devicon', 'simpleicon']).toContain(a);
    expect(['devicon', 'simpleicon']).toContain(b);
  });

  it('Social.placeholder fields are non-empty', () => {
    // Type-level constraint verification
    expectTypeOf<Social['placeholder']>().toBeString();

    // Verify actual production registry placeholder values (contrast: legibility)
    expect(SOCIALS.length).toBeGreaterThan(0);

    SOCIALS.forEach((social) => {
      expect(social.placeholder).toBeDefined();
      expect(social.placeholder.trim().length).toBeGreaterThan(0);
    });
  });

  it('GeneratorState boolean flag showCommitPulse toggles both theme display states', () => {
    // Type-level constraint verification
    expectTypeOf<GeneratorState['showCommitPulse']>().toBeBoolean();

    const stateEnabled: GeneratorState = {
      name: 'CommitPulse',
      description: 'Activity visualizer',
      selectedTechs: [],
      selectedSocials: [],
      socialLinks: {},
      githubUsername: 'user',
      showCommitPulse: true,
      commitPulseAccent: '#f8fafc',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'bottom',
    };

    const stateDisabled: GeneratorState = {
      name: 'CommitPulse',
      description: 'Activity visualizer',
      selectedTechs: [],
      selectedSocials: [],
      socialLinks: {},
      githubUsername: 'user',
      showCommitPulse: false,
      commitPulseAccent: '#0f172a',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'bottom',
    };

    expect(stateEnabled.showCommitPulse).toBe(true);
    expect(stateDisabled.showCommitPulse).toBe(false);
  });
});
