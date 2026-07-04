import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  GeneratorState,
  Technology,
  TechCategory,
  Social,
  SocialCategory,
  IconType,
} from './types';

const ALL_TECH_CATEGORIES: TechCategory[] = [
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

const ALL_SOCIAL_CATEGORIES: SocialCategory[] = [
  'Social Media',
  'Developer',
  'Competitive Programming',
  'Professional',
  'Streaming',
  'Contact',
  'Portfolio',
  'Support',
];

describe('GeneratorTypes Massive Data Sets and Extreme High Bounds Scaling (Variation 2)', () => {
  it('Case 1: GeneratorState.selectedTechs handles a 5,000-item array without type violations', () => {
    expectTypeOf<GeneratorState['selectedTechs']>().toEqualTypeOf<string[]>();

    const start = performance.now();
    const largeTechs = Array.from({ length: 5000 }, (_, i) => `tech-id-${i}`);
    const state: GeneratorState = {
      name: 'Scaling Test',
      description: 'Massive scale check',
      selectedTechs: largeTechs,
      selectedSocials: [],
      socialLinks: {},
      githubUsername: 'scale-user',
      showCommitPulse: true,
      commitPulseAccent: '#00ff00',
      showRepoSpotlight: false,
      spotlightRepo: '',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'middle',
    };
    const end = performance.now();

    expect(state.selectedTechs).toHaveLength(5000);
    expect(state.selectedTechs[0]).toBe('tech-id-0');
    expect(state.selectedTechs[4999]).toBe('tech-id-4999');

    // Ensure representative items are strings to avoid O(N) check overhead
    expect(typeof state.selectedTechs[0]).toBe('string');
    expect(typeof state.selectedTechs[2500]).toBe('string');
    expect(typeof state.selectedTechs[4999]).toBe('string');

    // Duplicate size check using Set
    const uniqueTechs = new Set(state.selectedTechs);
    expect(uniqueTechs.size).toBe(5000);

    const duration = end - start;
    expect(duration).toBeLessThan(1000);
  });

  it('Case 2: GeneratorState.socialLinks Record handles 1,000 keys with extreme-length URL values', () => {
    expectTypeOf<GeneratorState['socialLinks']>().toEqualTypeOf<Record<string, string>>();

    const start = performance.now();
    const socialLinks: Record<string, string> = {};
    const longUrlSegment = 'a'.repeat(500); // build a very long string segment to reach 500 characters
    for (let i = 0; i < 1000; i++) {
      socialLinks[`platform-${i}`] = `https://example.com/long-path/${longUrlSegment}/user-${i}`;
    }

    const state: GeneratorState = {
      name: 'Scaling Test',
      description: 'Massive scale check',
      selectedTechs: [],
      selectedSocials: [],
      socialLinks,
      githubUsername: 'scale-user',
      showCommitPulse: true,
      commitPulseAccent: '#00ff00',
      showRepoSpotlight: false,
      spotlightRepo: '',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'middle',
    };
    const end = performance.now();

    const keys = Object.keys(state.socialLinks);
    expect(keys).toHaveLength(1000);
    expect(keys[0]).toBe('platform-0');
    expect(state.socialLinks['platform-0'].length).toBeGreaterThan(500);

    // Verify all links have length > 0
    keys.forEach((key) => {
      expect(state.socialLinks[key]).toBeTypeOf('string');
      expect(state.socialLinks[key].length).toBeGreaterThan(0);
    });

    const duration = end - start;
    expect(duration).toBeLessThan(1000);
  });

  it('Case 3: Technology array with 10,000 entries across all TechCategory values stays well-formed', () => {
    expectTypeOf<Technology['category']>().toEqualTypeOf<TechCategory>();

    const start = performance.now();
    const technologies: Technology[] = [];

    for (let i = 0; i < 10000; i++) {
      const category = ALL_TECH_CATEGORIES[i % ALL_TECH_CATEGORIES.length];
      const type: IconType = i % 2 === 0 ? 'devicon' : 'simpleicon';
      technologies.push({
        id: `tech-${i}`,
        name: `Technology ${i}`,
        category,
        iconUrl: `https://cdn.example.com/icons/tech-${i}.svg`,
        type,
      });
    }
    const end = performance.now();

    expect(technologies).toHaveLength(10000);

    // Verify category representation
    const categoryCount = ALL_TECH_CATEGORIES.reduce(
      (acc, cat) => {
        acc[cat] = 0;
        return acc;
      },
      {} as Record<TechCategory, number>
    );

    technologies.forEach((tech) => {
      expect(ALL_TECH_CATEGORIES).toContain(tech.category);
      categoryCount[tech.category]++;
      expect(tech.iconUrl.length).toBeGreaterThan(0);
      expect(['devicon', 'simpleicon']).toContain(tech.type);
    });

    // Assert all 13 categories are represented
    ALL_TECH_CATEGORIES.forEach((cat) => {
      expect(categoryCount[cat]).toBeGreaterThan(0);
    });

    const duration = end - start;
    expect(duration).toBeLessThan(2000);
  });

  it('Case 4: Social array with extreme baseUrl and placeholder string lengths stays structurally valid', () => {
    expectTypeOf<Social['baseUrl']>().toBeString();
    expectTypeOf<Social['placeholder']>().toBeString();

    const start = performance.now();
    const socials: Social[] = [];
    const extremeBaseUrl = 'https://' + 'a'.repeat(287) + '.com/'; // length is 300
    const extremePlaceholder = 'p'.repeat(200); // length is 200

    for (let i = 0; i < 2000; i++) {
      const category = ALL_SOCIAL_CATEGORIES[i % ALL_SOCIAL_CATEGORIES.length];
      const type: IconType = i % 2 === 0 ? 'devicon' : 'simpleicon';
      const social: Social = {
        id: `social-${i}`,
        name: `Social Platform ${i}`,
        category,
        iconUrl: `https://icons.com/social-${i}.png`,
        type,
        baseUrl: extremeBaseUrl,
        placeholder: extremePlaceholder,
      };

      // present on half, absent on half
      if (i % 2 === 0) {
        social.siSlug = `slug-${i}`;
      }

      socials.push(social);
    }
    const end = performance.now();

    expect(socials).toHaveLength(2000);

    let siSlugCount = 0;
    socials.forEach((social, idx) => {
      expect(social.baseUrl).toHaveLength(300);
      expect(social.placeholder).toHaveLength(200);
      expect(social.placeholder.trim().length).toBeGreaterThan(0);

      if (social.siSlug !== undefined) {
        expect(social.siSlug).toBe(`slug-${idx}`);
        siSlugCount++;
      }
    });

    expect(siSlugCount).toBe(1000);

    const duration = end - start;
    expect(duration).toBeLessThan(2000);
  });

  it('Case 5: GeneratorState with all fields at upper bounds composes and serializes without data loss', () => {
    const name = 'N'.repeat(500);
    const description = 'D'.repeat(2000);
    const selectedTechs = Array.from({ length: 5000 }, (_, i) => `tech-${i}`);
    const selectedSocials = Array.from({ length: 1000 }, (_, i) => `social-${i}`);

    const socialLinks: Record<string, string> = {};
    const longUrlSegment = 'url'.repeat(150); // 450 chars
    selectedSocials.forEach((id) => {
      socialLinks[id] = `https://link.com/${longUrlSegment}/${id}`;
    });

    const state: GeneratorState = {
      name,
      description,
      selectedTechs,
      selectedSocials,
      socialLinks,
      githubUsername: 'scale-user',
      showCommitPulse: true,
      commitPulseAccent: '#ff0055',
      showRepoSpotlight: false,
      spotlightRepo: '',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'bottom',
    };

    const start = performance.now();
    const serialized = JSON.stringify(state);
    const parsed = JSON.parse(serialized) as GeneratorState;
    const end = performance.now();

    expect(parsed.name).toBe(name);
    expect(parsed.name).toHaveLength(500);
    expect(parsed.description).toBe(description);
    expect(parsed.description).toHaveLength(2000);
    expect(parsed.selectedTechs).toHaveLength(5000);
    expect(parsed.selectedTechs[0]).toBe('tech-0');
    expect(parsed.selectedSocials).toHaveLength(1000);
    expect(parsed.selectedSocials[0]).toBe('social-0');
    expect(Object.keys(parsed.socialLinks)).toHaveLength(1000);
    expect(parsed.socialLinks['social-0']).toBe(socialLinks['social-0']);
    expect(parsed.githubUsername).toBe('scale-user');
    expect(parsed.showCommitPulse).toBe(true);
    expect(parsed.commitPulseAccent).toBe('#ff0055');
    expect(parsed.showSnakeGraph).toBe(true);
    expect(parsed.showPacmanGraph).toBe(true);
    expect(parsed.graphPlacement).toBe('bottom');

    const duration = end - start;
    expect(duration).toBeLessThan(3000);
  });
});
