import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { ReadmeInsight } from './ReadmeInsight';
import type { GeneratorState } from '../types';
import React from 'react';

const EMPTY_STATE: GeneratorState = {
  name: '',
  description: '',
  selectedTechs: [],
  selectedSocials: [],
  socialLinks: {},
  githubUsername: '',
  showCommitPulse: false,
  commitPulseAccent: '',
  showRepoSpotlight: false,
  spotlightRepo: '',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
};

describe('ReadmeInsight Component Tests', () => {
  it('renders title and correct default tip when state is completely empty', () => {
    render(<ReadmeInsight state={EMPTY_STATE} />);

    expect(screen.getByText('README Insight')).toBeInTheDocument();
    expect(screen.getByText('💡 Improve description clarity')).toBeInTheDocument();
    expect(screen.getByText('Health Boost +20%')).toBeInTheDocument();
  });

  it('suggests adding badges when description is filled but showCommitPulse is false', () => {
    const state = { ...EMPTY_STATE, description: 'Awesome project' };
    render(<ReadmeInsight state={state} />);

    expect(screen.getByText('💡 Add badges for credibility')).toBeInTheDocument();
    expect(screen.getByText('Health Boost +10%')).toBeInTheDocument();
  });

  it('suggests including social links when description and commitPulse are enabled but socials are empty', () => {
    const state = {
      ...EMPTY_STATE,
      description: 'Awesome project',
      showCommitPulse: true,
      githubUsername: 'roshesh',
    };
    render(<ReadmeInsight state={state} />);

    expect(screen.getByText('💡 Include social links')).toBeInTheDocument();
    expect(screen.getByText('Health Boost +20%')).toBeInTheDocument();
  });

  it('suggests adding installation steps when all key items are filled', () => {
    const state = {
      ...EMPTY_STATE,
      name: 'CommitPulse',
      description: 'Awesome project',
      showCommitPulse: true,
      githubUsername: 'roshesh',
      selectedSocials: ['github'],
      socialLinks: { github: 'https://github.com/roshesh' },
    };
    render(<ReadmeInsight state={state} />);

    expect(screen.getByText('💡 Add installation steps')).toBeInTheDocument();
    expect(screen.getByText('Health Boost +15%')).toBeInTheDocument();
  });
});
