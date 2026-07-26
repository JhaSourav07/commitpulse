import { describe, it, expect } from 'vitest';
import { generateReadmeWorkflow } from './workflowGenerator';
import type { GeneratorState } from '../types';

describe('generateReadmeWorkflow', () => {
  const getBaseState = (): GeneratorState => ({
    name: '',
    description: '',
    selectedTechs: [],
    selectedSocials: [],
    socialLinks: {},
    githubUsername: 'testuser',
    showCommitPulse: false,
    commitPulseAccent: '',
    showRepoSpotlight: false,
    spotlightRepo: '',
    showSnakeGraph: false,
    showPacmanGraph: false,
    graphPlacement: 'bottom',
  });

  it('returns null if neither snake nor pacman are enabled', () => {
    const state = getBaseState();
    expect(generateReadmeWorkflow(state)).toBeNull();
  });

  it('returns null if username is empty', () => {
    const state = getBaseState();
    state.showSnakeGraph = true;
    state.githubUsername = '   ';
    expect(generateReadmeWorkflow(state)).toBeNull();
  });

  it('generates workflow for snake only', () => {
    const state = getBaseState();
    state.showSnakeGraph = true;

    const yaml = generateReadmeWorkflow(state);
    expect(yaml).not.toBeNull();
    expect(yaml).toContain('Platane/snk@v3');
    expect(yaml).toContain('github_user_name: testuser');
    expect(yaml).not.toContain('pacman-contribution-graph');
  });

  it('generates workflow for pacman only', () => {
    const state = getBaseState();
    state.showPacmanGraph = true;

    const yaml = generateReadmeWorkflow(state);
    expect(yaml).not.toBeNull();
    expect(yaml).toContain('abozanona/pacman-contribution-graph@main');
    expect(yaml).toContain('github_user_name: testuser');
    expect(yaml).not.toContain('Platane/snk@v3');
  });

  it('generates combined workflow when both are enabled', () => {
    const state = getBaseState();
    state.showSnakeGraph = true;
    state.showPacmanGraph = true;

    const yaml = generateReadmeWorkflow(state);
    expect(yaml).not.toBeNull();
    expect(yaml).toContain('Platane/snk@v3');
    expect(yaml).toContain('abozanona/pacman-contribution-graph@main');
  });

  it('uses the provided cron schedule', () => {
    const state = getBaseState();
    state.showSnakeGraph = true;

    const yaml = generateReadmeWorkflow(state, '0 12 * * *');
    expect(yaml).toContain('cron: "0 12 * * *"');
  });
});
