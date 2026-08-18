import { describe, it, expect } from 'vitest';
import { generateReadme } from './readmeGenerator';
import type { GeneratorState } from '../types';

const sampleState: GeneratorState = {
  layoutTemplate: 'classic',
  name: 'Alex Developer',
  description: 'Full stack software architect',
  showHeroImage: true,
  heroImageUrl: 'https://example.com/hero.gif',
  selectedTechs: ['typescript', 'react'],
  selectedSocials: ['github'],
  socialLinks: { github: 'alexdev' },
  githubUsername: 'alexdev',
  showCommitPulse: true,
  commitPulseAccent: '00ff00',
  showRepoSpotlight: true,
  spotlightRepo: 'awesome-project',
  showArticles: true,
  articlesPlatform: 'devto',
  articlesUsername: 'alexdev',
  showSnakeGraph: true,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
};

describe('readmeGenerator Layout Templates', () => {
  it('generates sections in Classic order by default', () => {
    const md = generateReadme({ ...sampleState, layoutTemplate: 'classic' });
    const headerPos = md.indexOf("Hi, I'm Alex Developer");
    const heroPos = md.indexOf('https://example.com/hero.gif');
    const techPos = md.indexOf('Tech Stack');
    const socialPos = md.indexOf('Connect With Me');
    const streakPos = md.indexOf('GitHub Streak');
    const spotlightPos = md.indexOf('Repository Spotlight');
    const articlesPos = md.indexOf('Latest Articles');
    const graphsPos = md.indexOf('Snake Contribution Graph');

    expect(headerPos).toBeGreaterThan(-1);
    expect(heroPos).toBeGreaterThan(headerPos);
    expect(techPos).toBeGreaterThan(heroPos);
    expect(socialPos).toBeGreaterThan(techPos);
    expect(streakPos).toBeGreaterThan(socialPos);
    expect(spotlightPos).toBeGreaterThan(streakPos);
    expect(articlesPos).toBeGreaterThan(spotlightPos);
    expect(graphsPos).toBeGreaterThan(articlesPos);
  });

  it('generates sections in Minimalist order', () => {
    const md = generateReadme({ ...sampleState, layoutTemplate: 'minimalist' });
    const headerPos = md.indexOf("Hi, I'm Alex Developer");
    const socialPos = md.indexOf('Connect With Me');
    const techPos = md.indexOf('Tech Stack');
    const heroPos = md.indexOf('https://example.com/hero.gif');
    const streakPos = md.indexOf('GitHub Streak');
    const spotlightPos = md.indexOf('Repository Spotlight');
    const articlesPos = md.indexOf('Latest Articles');
    const graphsPos = md.indexOf('Snake Contribution Graph');

    expect(headerPos).toBeLessThan(socialPos);
    expect(socialPos).toBeLessThan(techPos);
    expect(techPos).toBeLessThan(heroPos);
    expect(heroPos).toBeLessThan(streakPos);
    expect(streakPos).toBeLessThan(spotlightPos);
    expect(spotlightPos).toBeLessThan(articlesPos);
    expect(articlesPos).toBeLessThan(graphsPos);
  });

  it('generates sections in Data Heavy order', () => {
    const md = generateReadme({ ...sampleState, layoutTemplate: 'data-heavy' });
    const headerPos = md.indexOf("Hi, I'm Alex Developer");
    const streakPos = md.indexOf('GitHub Streak');
    const spotlightPos = md.indexOf('Repository Spotlight');
    const graphsPos = md.indexOf('Snake Contribution Graph');
    const techPos = md.indexOf('Tech Stack');
    const socialPos = md.indexOf('Connect With Me');
    const heroPos = md.indexOf('https://example.com/hero.gif');
    const articlesPos = md.indexOf('Latest Articles');

    expect(headerPos).toBeLessThan(streakPos);
    expect(streakPos).toBeLessThan(spotlightPos);
    expect(spotlightPos).toBeLessThan(graphsPos);
    expect(graphsPos).toBeLessThan(techPos);
    expect(techPos).toBeLessThan(socialPos);
    expect(socialPos).toBeLessThan(heroPos);
    expect(heroPos).toBeLessThan(articlesPos);
  });

  it('generates sections in Storyteller order', () => {
    const md = generateReadme({ ...sampleState, layoutTemplate: 'storyteller' });
    const headerPos = md.indexOf("Hi, I'm Alex Developer");
    const heroPos = md.indexOf('https://example.com/hero.gif');
    const articlesPos = md.indexOf('Latest Articles');
    const spotlightPos = md.indexOf('Repository Spotlight');
    const techPos = md.indexOf('Tech Stack');
    const streakPos = md.indexOf('GitHub Streak');
    const socialPos = md.indexOf('Connect With Me');
    const graphsPos = md.indexOf('Snake Contribution Graph');

    expect(headerPos).toBeLessThan(heroPos);
    expect(heroPos).toBeLessThan(articlesPos);
    expect(articlesPos).toBeLessThan(spotlightPos);
    expect(spotlightPos).toBeLessThan(techPos);
    expect(techPos).toBeLessThan(streakPos);
    expect(streakPos).toBeLessThan(socialPos);
    expect(socialPos).toBeLessThan(graphsPos);
  });

  it('falls back to Classic layout when layoutTemplate is missing', () => {
    const stateWithoutLayout = { ...sampleState };
    delete stateWithoutLayout.layoutTemplate;
    const md = generateReadme(stateWithoutLayout);

    const headerPos = md.indexOf("Hi, I'm Alex Developer");
    const heroPos = md.indexOf('https://example.com/hero.gif');
    const techPos = md.indexOf('Tech Stack');

    expect(headerPos).toBeLessThan(heroPos);
    expect(heroPos).toBeLessThan(techPos);
  });
});
