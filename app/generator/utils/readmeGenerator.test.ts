import { describe, it, expect } from 'vitest';
import { generateReadme } from './readmeGenerator';
import type { GeneratorState } from '../types';

const mockState: GeneratorState = {
  name: 'John Doe',
  description: 'A developer',
  selectedTechs: [],
  selectedSocials: [],
  socialLinks: {},
  githubUsername: 'johndoe',
  showCommitPulse: false,
  commitPulseAccent: '',
  showRepoSpotlight: false,
  spotlightRepo: '',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
};

describe('readmeGenerator', () => {
  it('generates basic readme without contribution graphs', () => {
    const md = generateReadme(mockState);
    expect(md).toContain("# 👋 Hi, I'm John Doe");
    expect(md).not.toContain('Snake Contribution Graph');
    expect(md).not.toContain('Pacman Contribution Graph');
  });

  it('includes Snake contribution graph in bottom placement by default', () => {
    const state = { ...mockState, showSnakeGraph: true };
    const md = generateReadme(state);
    expect(md).toContain('## 🐍 Snake Contribution Graph');
    expect(md).toContain(
      'https://raw.githubusercontent.com/johndoe/johndoe/output/github-snake.svg'
    );
    expect(md).toContain('github-snake-dark.svg');
  });

  it('includes Pacman contribution graph in middle placement', () => {
    const state = { ...mockState, showPacmanGraph: true, graphPlacement: 'middle' as const };
    const md = generateReadme(state);
    expect(md).toContain('## 👾 Pacman Contribution Graph');
    expect(md).toContain(
      'https://raw.githubusercontent.com/johndoe/johndoe/output/pacman-contribution-graph.svg'
    );
    expect(md).toContain('pacman-contribution-graph-dark.svg');
  });

  it('includes both contribution graphs in top placement', () => {
    const state = {
      ...mockState,
      showRepoSpotlight: false,
      spotlightRepo: '',
      showSnakeGraph: true,
      showPacmanGraph: true,
      graphPlacement: 'top' as const,
    };
    const md = generateReadme(state);
    expect(md).toContain('## 🐍 Snake Contribution Graph');
    expect(md).toContain('## 👾 Pacman Contribution Graph');
  });

  it('orders sections according to the Data Heavy template', () => {
    const state: GeneratorState = {
      ...mockState,
      selectedTechs: ['react'],
      selectedSocials: ['github'],
      socialLinks: { github: 'https://github.com/johndoe' },
      showCommitPulse: true,
      showRepoSpotlight: true,
      spotlightRepo: 'sample-repo',
      showArticles: true,
      articlesUsername: 'johndoe',
      layoutTemplate: 'data-heavy',
    };

    const md = generateReadme(state);
    const commitPulseIndex = md.indexOf('## 📊 GitHub Streak');
    const repoSpotlightIndex = md.indexOf('## 🌟 Repository Spotlight');
    const articlesIndex = md.indexOf('## 📝 Latest Articles');
    const techIndex = md.indexOf('## 🛠️ Tech Stack');
    const socialsIndex = md.indexOf('## 🌐 Connect With Me');

    expect(commitPulseIndex).toBeGreaterThan(-1);
    expect(commitPulseIndex).toBeLessThan(repoSpotlightIndex);
    expect(repoSpotlightIndex).toBeLessThan(articlesIndex);
    expect(articlesIndex).toBeLessThan(techIndex);
    expect(techIndex).toBeLessThan(socialsIndex);
  });
});
