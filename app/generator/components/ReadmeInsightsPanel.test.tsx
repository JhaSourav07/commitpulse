import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { ReadmeInsightsPanel } from './ReadmeInsightsPanel';
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

describe('ReadmeInsightsPanel Component Tests', () => {
  it('renders with Beginner grade when state is completely empty (score 0)', () => {
    render(<ReadmeInsightsPanel state={EMPTY_STATE} />);

    expect(screen.getByText('README Insights')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Suggested Improvements')).toBeInTheDocument();
  });

  it('shows up to 4 tips when state is empty', () => {
    render(<ReadmeInsightsPanel state={EMPTY_STATE} />);

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeLessThanOrEqual(4);
    expect(items.length).toBeGreaterThan(0);
  });

  it('shows Beginner grade for score <= 30 (name only = 15%)', () => {
    const state = { ...EMPTY_STATE, name: 'Roshesh' };
    render(<ReadmeInsightsPanel state={state} />);

    expect(screen.getByText('Beginner')).toBeInTheDocument();
  });

  it('shows Intermediate grade for score 31–60 (name + description = 35%)', () => {
    const state = { ...EMPTY_STATE, name: 'Roshesh', description: 'Full-stack developer' };
    render(<ReadmeInsightsPanel state={state} />);

    expect(screen.getByText('Intermediate')).toBeInTheDocument();
  });

  it('shows Advanced grade for score 61–85 (name + desc + techs + github = 70%)', () => {
    const state = {
      ...EMPTY_STATE,
      name: 'Roshesh',
      description: 'Dev',
      selectedTechs: ['react', 'nextjs', 'typescript'],
      githubUsername: 'roshesh',
    };
    render(<ReadmeInsightsPanel state={state} />);

    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('shows Pro grade for score >= 86 (name + desc + techs + socials + github = 90%)', () => {
    const state = {
      ...EMPTY_STATE,
      name: 'Roshesh',
      description: 'Dev',
      selectedTechs: ['react', 'nextjs', 'typescript'],
      selectedSocials: ['twitter'],
      socialLinks: { twitter: 'https://twitter.com/test' },
      githubUsername: 'roshesh',
    };
    render(<ReadmeInsightsPanel state={state} />);

    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('generates relevant tips for missing techs and socials', () => {
    const state = { ...EMPTY_STATE, name: 'Roshesh', description: 'Dev' };
    render(<ReadmeInsightsPanel state={state} />);

    expect(screen.getByText('Add technologies to showcase your skills.')).toBeInTheDocument();
    expect(
      screen.getByText('Connect your social profiles to make collaboration easier.')
    ).toBeInTheDocument();
  });

  it('does not show tips for completed sections', () => {
    const state = {
      ...EMPTY_STATE,
      name: 'Roshesh',
      description: 'Dev',
      selectedTechs: ['react', 'nextjs', 'typescript'],
      selectedSocials: ['twitter'],
      socialLinks: { twitter: 'https://twitter.com/test' },
      githubUsername: 'roshesh',
      showCommitPulse: true,
    };
    render(<ReadmeInsightsPanel state={state} />);

    expect(
      screen.getByText('Your README is looking great — all sections are filled!')
    ).toBeInTheDocument();
  });

  it('shows specific tip when 2 techs are selected (need 1 more)', () => {
    const state = {
      ...EMPTY_STATE,
      selectedTechs: ['react', 'nextjs'],
    };
    render(<ReadmeInsightsPanel state={state} />);

    expect(
      screen.getByText('Add 1 more technology to better showcase your skills.')
    ).toBeInTheDocument();
  });

  it('has correct aria-label for accessibility', () => {
    render(<ReadmeInsightsPanel state={EMPTY_STATE} />);

    const panel = screen.getByLabelText('README Insights');
    expect(panel).toBeInTheDocument();
  });
});
