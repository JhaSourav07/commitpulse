import { describe, expect, it, vi, beforeEach } from 'vitest';
import { generateReadme, getEmptyReadme } from './readmeGenerator';
import { GeneratorState } from '../types';

vi.mock('../data/technologies', () => ({
  getTechById: (id: string) => {
    if (id === 'react') {
      return {
        id: 'react',
        name: 'React',
        type: 'simpleicon',
        iconUrl: 'https://cdn.simpleicons.org/react',
      };
    }
    if (id === 'custom') {
      return {
        id: 'custom',
        name: 'CustomTech',
        type: 'custom',
        iconUrl: 'https://example.com/custom.png',
      };
    }
    return null;
  },
}));

vi.mock('../data/socials', () => ({
  getSocialById: (id: string) => {
    if (id === 'github') {
      return { id: 'github', name: 'GitHub', type: 'simpleicon', siSlug: 'github', iconUrl: '' };
    }
    if (id === 'email') {
      return {
        id: 'email',
        name: 'Email',
        type: 'custom',
        iconUrl: 'https://example.com/email.png',
      };
    }
    return null;
  },
}));

describe('readmeGenerator - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  let mockState: GeneratorState;

  beforeEach(() => {
    vi.clearAllMocks();

    mockState = {
      name: 'Octocat',
      description: 'Open source contributor profile.',
      githubUsername: 'octocat',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'middle',
      selectedTechs: ['react', 'custom'],
      selectedSocials: ['github', 'email'],
      socialLinks: {
        github: 'https://github.com/octocat',
        email: 'octocat@github.com',
      },
      showCommitPulse: true,
      commitPulseAccent: '#ff0055',
      showRepoSpotlight: true,
      spotlightRepo: 'hello-world',
    };
  });

  // Test 1: Hex and String URL parameter conversions
  it('correctly normalizes hex accent strings inside badge parameters', () => {
    mockState.commitPulseAccent = '#00ffcc';
    const outputMarkdown = generateReadme(mockState);

    expect(outputMarkdown).toContain('accent=00ffcc');
    expect(outputMarkdown).toContain('https://commitpulse.vercel.app/dashboard/octocat');
    expect(outputMarkdown).toContain('https://github.com/octocat/hello-world');
  });

  // Test 2: Color fallback constraint limits
  it('skips validation parameter mapping when custom colors fail formatting constraints', () => {
    mockState.commitPulseAccent = 'invalid-non-hex-color-string';
    const outputMarkdown = generateReadme(mockState);

    expect(outputMarkdown).not.toContain('accent=');
  });

  // Test 3: Standard structural fallback placeholders
  it('handles empty collection parameters safely when rendering the placeholder baseline layout profile', () => {
    const defaultReadme = getEmptyReadme();

    expect(defaultReadme).toContain("# 👋 Hi, I'm Your Name");
    expect(defaultReadme).toContain('Your description goes here...');
  });

  // Test 4: Dynamic section layout placement boundaries (Exactly 5 tests constraint mapping)
  it('correctly shifts graph markup sections across top, middle, and bottom boundaries matching state rules', () => {
    // Phase 1: Test top alignment parameters
    mockState.graphPlacement = 'top';
    const topMarkdown = generateReadme(mockState);
    expect(topMarkdown.indexOf('Snake Contribution')).toBeLessThan(
      topMarkdown.indexOf('Tech Stack')
    );

    // Phase 2: Test middle alignment parameters with highly legible variable indices
    mockState.graphPlacement = 'middle';
    const middleMarkdown = generateReadme(mockState);
    const indexTech = middleMarkdown.indexOf('Tech Stack');
    const indexSnake = middleMarkdown.indexOf('Snake Contribution');
    const indexSocial = middleMarkdown.indexOf('Connect With Me');

    expect(indexTech).toBeLessThan(indexSnake);
    expect(indexSnake).toBeLessThan(indexSocial);

    // Phase 3: Test bottom alignment parameters
    mockState.graphPlacement = 'bottom';
    const bottomMarkdown = generateReadme(mockState);
    expect(bottomMarkdown.indexOf('Connect With Me')).toBeLessThan(
      bottomMarkdown.indexOf('Snake Contribution')
    );
  });

  // Test 5: String manipulation edge cases and custom media tags layout coverage
  it('handles whitespace suppression and processes custom email protocol formatting strings smoothly', () => {
    // Phase 1: Verify string white-space filtering parameters
    mockState.githubUsername = '   ';
    let outputMarkdown = generateReadme(mockState);
    expect(outputMarkdown).not.toContain('## 🐍 Snake Contribution Graph');
    expect(outputMarkdown).not.toContain('## 📊 GitHub Streak');

    // Phase 2: Verify dynamic fallback link interpolation and custom image layouts
    mockState.githubUsername = 'octocat';
    mockState.socialLinks.email = 'test@example.com';
    outputMarkdown = generateReadme(mockState);

    expect(outputMarkdown).toContain('href="mailto:test@example.com"');
    expect(outputMarkdown).toContain('https://example.com/custom.png');
  });
});
