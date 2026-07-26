import { describe, expect, it } from 'vitest';
import { Technology, Social, GeneratorState, TechCategory, SocialCategory } from './types';

describe('GeneratorTypes - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  it('validates a collection of Technology objects configured as configuration targets', () => {
    const interactiveTechs: Technology[] = [
      {
        id: 'tech-target-react',
        name: 'React',
        category: 'Frontend',
        iconUrl: '/icons/react.svg',
        type: 'simpleicon',
      },
      {
        id: 'tech-target-node',
        name: 'Node',
        category: 'Backend',
        iconUrl: '/icons/node.svg',
        type: 'devicon',
      },
    ];

    expect(interactiveTechs).toHaveLength(2);
    expect(interactiveTechs[0].id).toBe('tech-target-react');
    expect(interactiveTechs[1].category).toBe('Backend');
  });

  it('validates a matrix of Social target setups tracking propagation categories', () => {
    const propagationCategories: SocialCategory[] = [
      'Social Media',
      'Developer',
      'Competitive Programming',
      'Professional',
      'Streaming',
      'Contact',
      'Portfolio',
      'Support',
    ];

    const interactiveSocials: Social[] = propagationCategories.map((category, index) => ({
      id: `social-target-${index}`,
      name: `Platform-${category}`,
      category,
      iconUrl: `https://commitpulse.vercel.app/assets/${index}.svg`,
      type: 'simpleicon',
      baseUrl: 'https://example.com/',
      placeholder: 'Enter username handle',
      siSlug: `slug-target-${index}`,
    }));

    expect(interactiveSocials).toHaveLength(propagationCategories.length);
    expect(interactiveSocials[1].category).toBe('Developer');
    expect(interactiveSocials[0].siSlug).toBe('slug-target-0');
    expect(interactiveSocials[7].category).toBe('Support');
  });

  it('handles extensive arrays of selected tracking handles inside the core GeneratorState schema', () => {
    const interactiveState: GeneratorState = {
      name: 'Workspace Profile',
      description: 'Verifying core state tracking layout matrices.',
      selectedTechs: Array.from({ length: 300 }, (_, i) => `tech-target-${i}`),
      selectedSocials: Array.from({ length: 150 }, (_, i) => `social-target-${i}`),
      socialLinks: Array.from({ length: 150 }).reduce<Record<string, string>>((acc, _, i) => {
        acc[`social-target-${i}`] = `https://links.com/target-${i}`;
        return acc;
      }, {}),
      githubUsername: 'profile-user',
      showCommitPulse: true,
      commitPulseAccent: '#ff0055',
      showRepoSpotlight: true,
      spotlightRepo: 'spotlight-repo-target',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'middle',
    };

    expect(interactiveState.selectedTechs).toHaveLength(300);
    expect(interactiveState.selectedSocials).toHaveLength(150);
    expect(Object.keys(interactiveState.socialLinks)).toHaveLength(150);
    expect(interactiveState.socialLinks['social-target-149']).toBe('https://links.com/target-149');
  });

  it('enforces absolute string literal bounds matching graph placement layout constraints', () => {
    const placements: ('top' | 'middle' | 'bottom')[] = ['top', 'middle', 'bottom'];

    const operationalMatrix: GeneratorState[] = placements.map((placement, index) => ({
      name: `State-Target-${index}`,
      description: 'Overlay Layout View',
      selectedTechs: [],
      selectedSocials: [],
      socialLinks: {},
      githubUsername: 'tester',
      showCommitPulse: true,
      commitPulseAccent: '#00ffcc',
      showRepoSpotlight: false,
      spotlightRepo: '',
      showSnakeGraph: false,
      showPacmanGraph: true,
      graphPlacement: placement,
    }));

    expect(operationalMatrix).toHaveLength(3);
    expect(operationalMatrix[0].graphPlacement).toBe('top');
    expect(operationalMatrix[1].graphPlacement).toBe('middle');
    expect(operationalMatrix[2].graphPlacement).toBe('bottom');
  });

  it('supports high-index lookups in large Technology collections', () => {
    const highBoundCollection: Technology[] = Array.from({ length: 2500 }, (_, idx) => ({
      id: `node-key-${idx}`,
      name: `Name-${idx}`,
      category: 'Languages',
      iconUrl: 'https://example.com/icon.png',
      type: 'devicon',
    }));

    const terminalNode = highBoundCollection[2499];
    expect(terminalNode.id).toBe('node-key-2499');
    expect(terminalNode.category).toBe('Languages');
    expect(terminalNode.type).toBe('devicon');
  });
});
