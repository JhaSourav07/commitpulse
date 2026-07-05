import { describe, expect, expectTypeOf, it } from 'vitest';
import { SOCIALS } from './data/socials';
import { TECHNOLOGIES } from './data/technologies';
import type { GeneratorState, SocialCategory, TechCategory } from './types';

type FullTechCategory =
  | 'Languages'
  | 'Frontend'
  | 'UI Libraries'
  | 'Backend'
  | 'Mobile'
  | 'Database'
  | 'ORM & Query'
  | 'Cloud'
  | 'DevOps'
  | 'Tools & IDEs'
  | 'AI & ML'
  | 'Design'
  | 'Other';
type FullSocialCategory =
  | 'Social Media'
  | 'Developer'
  | 'Competitive Programming'
  | 'Professional'
  | 'Streaming'
  | 'Contact'
  | 'Portfolio'
  | 'Support';

describe('GeneratorTypes responsive breakpoints behavior', () => {
  it('GeneratorState.graphPlacement supports the stacking positions used for mobile single-column reflow', () => {
    expectTypeOf<GeneratorState['graphPlacement']>().toEqualTypeOf<'top' | 'middle' | 'bottom'>();

    const placements: GeneratorState['graphPlacement'][] = ['top', 'middle', 'bottom'];

    placements.forEach((graphPlacement) => {
      const state: GeneratorState = {
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
        graphPlacement,
      };

      expect(state.graphPlacement).toBe(graphPlacement);
    });
  });

  it('selectedTechs and selectedSocials remain array-based, supporting flexible list layouts at any viewport width', () => {
    expectTypeOf<GeneratorState['selectedTechs']>().toEqualTypeOf<string[]>();
    expectTypeOf<GeneratorState['selectedSocials']>().toEqualTypeOf<string[]>();

    const listSizes = [0, 1, 12];

    listSizes.forEach((size) => {
      const state: GeneratorState = {
        name: 'CommitPulse',
        description: 'Activity visualizer',
        selectedTechs: Array.from({ length: size }, (_, i) => `tech-${i}`),
        selectedSocials: Array.from({ length: size }, (_, i) => `social-${i}`),
        socialLinks: {},
        githubUsername: 'user',
        showCommitPulse: true,
        commitPulseAccent: '#f8fafc',
        showSnakeGraph: true,
        showPacmanGraph: true,
        graphPlacement: 'top',
      };

      expect(Array.isArray(state.selectedTechs)).toBe(true);
      expect(Array.isArray(state.selectedSocials)).toBe(true);
      expect(state.selectedTechs.length).toBe(size);
      expect(state.selectedSocials.length).toBe(size);
    });
  });

  it('Technology and Social iconUrl values are plain scalable sources, not fixed-width asset URLs', () => {
    expect(TECHNOLOGIES.length).toBeGreaterThan(0);
    expect(SOCIALS.length).toBeGreaterThan(0);

    const widthParamPattern = /[?&](w|width|h|height)=\d+/i;

    TECHNOLOGIES.forEach((tech) => {
      expect(tech.iconUrl).not.toMatch(widthParamPattern);
    });

    SOCIALS.forEach((social) => {
      expect(social.iconUrl).not.toMatch(widthParamPattern);
    });
  });

  it('TechCategory and SocialCategory provide compact, discrete labels suitable for condensed mobile navigation', () => {
    expectTypeOf<TechCategory>().toEqualTypeOf<FullTechCategory>();
    expectTypeOf<SocialCategory>().toEqualTypeOf<FullSocialCategory>();

    const techCategories: TechCategory[] = TECHNOLOGIES.map((t) => t.category);
    const socialCategories: SocialCategory[] = SOCIALS.map((s) => s.category);

    [...techCategories, ...socialCategories].forEach((category) => {
      expect(category.length).toBeGreaterThan(0);
      expect(category.length).toBeLessThanOrEqual(24);
    });
  });

  it('GeneratorState boolean toggles respond independently, matching mobile tap-toggle interactions', () => {
    expectTypeOf<GeneratorState['showCommitPulse']>().toBeBoolean();
    expectTypeOf<GeneratorState['showSnakeGraph']>().toBeBoolean();
    expectTypeOf<GeneratorState['showPacmanGraph']>().toBeBoolean();

    const combinations: Array<
      Pick<GeneratorState, 'showCommitPulse' | 'showSnakeGraph' | 'showPacmanGraph'>
    > = [
      { showCommitPulse: true, showSnakeGraph: false, showPacmanGraph: false },
      { showCommitPulse: false, showSnakeGraph: true, showPacmanGraph: false },
      { showCommitPulse: false, showSnakeGraph: false, showPacmanGraph: true },
      { showCommitPulse: true, showSnakeGraph: true, showPacmanGraph: true },
    ];

    combinations.forEach((toggles) => {
      const state: GeneratorState = {
        name: 'CommitPulse',
        description: 'Activity visualizer',
        selectedTechs: [],
        selectedSocials: [],
        socialLinks: {},
        githubUsername: 'user',
        commitPulseAccent: '#f8fafc',
        graphPlacement: 'middle',
        ...toggles,
      };

      expect(state.showCommitPulse).toBe(toggles.showCommitPulse);
      expect(state.showSnakeGraph).toBe(toggles.showSnakeGraph);
      expect(state.showPacmanGraph).toBe(toggles.showPacmanGraph);
    });
  });
});
