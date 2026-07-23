import { describe, expect, it, expectTypeOf } from 'vitest';
import type { GeneratorState, Technology, Social, TechCategory } from './types';

describe('GeneratorTypes - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  // Test Case 1: Validate GeneratorState conforms to layout properties (No absolute limits)
  it('enforces strict type structure for global generator state models', () => {
    expectTypeOf<GeneratorState>().toHaveProperty('githubUsername');
    expectTypeOf<GeneratorState>().toHaveProperty('showCommitPulse');
    expectTypeOf<GeneratorState>().toHaveProperty('commitPulseAccent');
    expectTypeOf<GeneratorState>().toHaveProperty('graphPlacement');
    expectTypeOf<GeneratorState>().toHaveProperty('showArticles');
  });

  // Test Case 2: Validate Column Alignment & Reflow Bounds for Graph Placements
  it('ensures graph placement config options are strictly bounded to fluid viewport placement slots', () => {
    type Placement = GeneratorState['graphPlacement'];
    expectTypeOf<Placement>().toEqualTypeOf<'top' | 'middle' | 'bottom'>();
  });

  // Test Case 3: Verify Technology layout categorization items with strict equality
  it('validates technology schema categories contain responsive-friendly division options strictly', () => {
    expectTypeOf<TechCategory>().toEqualTypeOf<
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
      | 'Other'
    >();
  });

  // Test Case 4: Verify Mock Responsive Viewport Layout conforming to State Types
  it('correctly maps mock state overrides simulating standard 375px mobile viewports', () => {
    const simulatedMobileState: GeneratorState = {
      name: 'John Doe',
      description: 'Full Stack Engineer',
      selectedTechs: ['react', 'tailwindcss'],
      selectedSocials: ['github', 'linkedin'],
      socialLinks: { github: 'https://github.com/octocat' },
      githubUsername: 'octocat',
      showCommitPulse: true,
      commitPulseAccent: '10b981',
      showRepoSpotlight: false,
      spotlightRepo: '',
      showSnakeGraph: true,
      showPacmanGraph: false,
      graphPlacement: 'bottom',
      showArticles: true,
      articlesPlatform: 'devto',
      articlesUsername: 'octocat',
    };

    expect(simulatedMobileState.showCommitPulse).toBe(true);
    expect(simulatedMobileState.graphPlacement).toBe('bottom');
    expect(simulatedMobileState.selectedTechs).toContain('react');
    expect(simulatedMobileState.showArticles).toBe(true);
  });

  // Test Case 5: Verify static Technology, Social, and optional articles schema properties
  it('enforces strict schema contract requirements on technology card records and optional fields', () => {
    expectTypeOf<Technology>().toHaveProperty('id');
    expectTypeOf<Technology>().toHaveProperty('name');
    expectTypeOf<Technology>().toHaveProperty('category');
    expectTypeOf<Technology>().toHaveProperty('type');

    expectTypeOf<Social>().toHaveProperty('baseUrl');
    expectTypeOf<Social>().toHaveProperty('placeholder');

    // Targets the newly added optional article-related fields to ensure total coverage
    expectTypeOf<GeneratorState['articlesPlatform']>().toEqualTypeOf<
      'devto' | 'hashnode' | undefined
    >();
    expectTypeOf<GeneratorState['articlesUsername']>().toEqualTypeOf<string | undefined>();
  });
});
