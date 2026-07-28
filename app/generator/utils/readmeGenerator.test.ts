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

  it('renders hero image when enabled with URL', () => {
    const state: GeneratorState = {
      ...mockState,
      showHeroImage: true,
      heroImageUrl: 'https://example.com/hero.gif',
      heroImageWidth: '450',
      heroImageAlign: 'center',
      heroImageAlt: 'Coding GIF',
    };
    const md = generateReadme(state);
    expect(md).toContain('<p align="center">');
    expect(md).toContain('src="https://example.com/hero.gif"');
    expect(md).toContain('alt="Coding GIF"');
    expect(md).toContain('width="450"');
  });

  it('renders hero image with custom alignment and width', () => {
    const state: GeneratorState = {
      ...mockState,
      showHeroImage: true,
      heroImageUrl: 'https://example.com/banner.png',
      heroImageWidth: '100%',
      heroImageAlign: 'left',
      heroImageAlt: 'Custom Banner',
    };
    const md = generateReadme(state);
    expect(md).toContain('<p align="left">');
    expect(md).toContain('src="https://example.com/banner.png"');
    expect(md).toContain('alt="Custom Banner"');
    expect(md).toContain('width="100%"');
  });
});
