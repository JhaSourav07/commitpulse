import { describe, expect, it } from 'vitest';
import { Technology, Social, GeneratorState, TechCategory, SocialCategory } from './types';

describe('GeneratorTypes - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  it('handles all TechCategory variations correctly', () => {
    const techCategories: TechCategory[] = [
      'Languages',
      'Frontend',
      'UI Libraries',
      'Backend',
      'Mobile',
      'Database',
      'ORM & Query',
      'Cloud',
      'DevOps',
      'Tools & IDEs',
      'AI & ML',
      'Design',
      'Other',
    ];

    const verifiedTechs: Technology[] = techCategories.map((category, index) => ({
      id: `tech-id-${index}`,
      name: `Tech-${category}`,
      category,
      iconUrl: `https://commitpulse.vercel.app/icons/${category}.svg`,
      type: index % 2 === 0 ? 'devicon' : 'simpleicon',
    }));

    expect(verifiedTechs).toHaveLength(techCategories.length);
    expect(verifiedTechs[0].category).toBe('Languages');
    expect(verifiedTechs[1].type).toBe('simpleicon');
  });

  it('supports Social configurations with optional properties', () => {
    const socialCategories: SocialCategory[] = [
      'Social Media',
      'Developer',
      'Competitive Programming',
      'Professional',
      'Streaming',
      'Contact',
      'Portfolio',
      'Support',
    ];

    const verifiedSocials: Social[] = socialCategories.map((category, index) => ({
      id: `social-id-${index}`,
      name: `Social-${category}`,
      category,
      iconUrl: `https://commitpulse.vercel.app/socials/${index}.svg`,
      type: 'simpleicon',
      baseUrl: 'https://github.com/',
      placeholder: 'Enter handle',
      siSlug: `slug-${index}`,
    }));

    expect(verifiedSocials).toHaveLength(socialCategories.length);
    expect(verifiedSocials[0].siSlug).toBe('slug-0');
    expect(verifiedSocials[0].type).toBe('simpleicon');
    expect(verifiedSocials[0].baseUrl).toBe('https://github.com/');
    expect(verifiedSocials[7].category).toBe('Support');
  });

  it('scales to support massive collection mapping parameters', () => {
    const massiveState: GeneratorState = {
      name: 'Octocat Profile',
      description: 'Massive timezone-boundary visualization setup tracking logs.',
      selectedTechs: Array.from({ length: 500 }, (_, i) => `tech-node-${i}`),
      selectedSocials: Array.from({ length: 100 }, (_, i) => `social-node-${i}`),
      socialLinks: Array.from({ length: 100 }).reduce<Record<string, string>>((acc, _, i) => {
        acc[`social-node-${i}`] = `https://platform.com/user-${i}`;
        return acc;
      }, {}),
      githubUsername: 'octocat',
      showCommitPulse: true,
      commitPulseAccent: '#00ffcc',
      showRepoSpotlight: true,
      spotlightRepo: 'hello-world',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'middle',
    };

    expect(massiveState.selectedTechs).toHaveLength(500);
    expect(massiveState.selectedSocials).toHaveLength(100);
    expect(Object.keys(massiveState.socialLinks)).toHaveLength(100);
    expect(massiveState.socialLinks['social-node-99']).toBe('https://platform.com/user-99');
  });

  it('enforces string literal constraints for graph placements', () => {
    const placements: ('top' | 'middle' | 'bottom')[] = ['top', 'middle', 'bottom'];

    const statesMatrix: GeneratorState[] = placements.map((placement, index) => ({
      name: `User-${index}`,
      description: 'Profile',
      selectedTechs: [],
      selectedSocials: [],
      socialLinks: {},
      githubUsername: 'user',
      showCommitPulse: false,
      commitPulseAccent: '#ffffff',
      showRepoSpotlight: false,
      spotlightRepo: '',
      showSnakeGraph: true,
      showPacmanGraph: false,
      graphPlacement: placement,
    }));

    expect(statesMatrix).toHaveLength(3);
    expect(statesMatrix[0].graphPlacement).toBe('top');
    expect(statesMatrix[1].graphPlacement).toBe('middle');
    expect(statesMatrix[2].graphPlacement).toBe('bottom');
  });

  it('supports high-index lookups in large Technology collections', () => {
    const boundaryCollection: Technology[] = Array.from({ length: 5000 }, (_, idx) => ({
      id: `tech-bound-key-${idx}`,
      name: `Name-${idx}`,
      category: 'Other',
      iconUrl: 'https://example.com/icon.png',
      type: 'devicon',
    }));

    const terminalNode = boundaryCollection[4999];
    expect(terminalNode.id).toBe('tech-bound-key-4999');
    expect(terminalNode.category).toBe('Other');
    expect(terminalNode.type).toBe('devicon');
  });
});
