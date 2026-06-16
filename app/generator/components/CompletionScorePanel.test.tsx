import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { CompletionScorePanel } from './CompletionScorePanel';
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
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
};

describe('CompletionScorePanel Component Tests', () => {
  it('renders with 0% score and Beginner level when state is completely empty', () => {
    render(<CompletionScorePanel state={EMPTY_STATE} />);

    expect(screen.getByText('README Completion Score')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Level: Beginner')).toBeInTheDocument();
    expect(screen.getByText('Poor')).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders with correct score when name is added (+15%)', () => {
    const state = { ...EMPTY_STATE, name: 'Roshesh' };
    render(<CompletionScorePanel state={state} />);

    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('Level: Beginner')).toBeInTheDocument();
    expect(screen.getByText('Poor')).toBeInTheDocument();
    expect(screen.getByText('Name Added')).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '15');
  });

  it('renders with correct score and Growing level when description is also added (+15 + 20 = 35%)', () => {
    const state = { ...EMPTY_STATE, name: 'Roshesh', description: 'Full-stack developer' };
    render(<CompletionScorePanel state={state} />);

    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(screen.getByText('Level: Growing')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('Name Added')).toBeInTheDocument();
    expect(screen.getByText('Description Added')).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '35');
  });

  it('handles the technologies condition correctly (+25% when >= 3)', () => {
    // 2 techs → score should still be 0% for techs
    const stateWithTwoTechs = {
      ...EMPTY_STATE,
      selectedTechs: ['react', 'nextjs'],
    };
    const { rerender } = render(<CompletionScorePanel state={stateWithTwoTechs} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(
      screen.getByText('Add more technologies to better showcase your skills.')
    ).toBeInTheDocument();

    // 3 techs → score should jump to 25% and show as complete
    const stateWithThreeTechs = {
      ...EMPTY_STATE,
      selectedTechs: ['react', 'nextjs', 'typescript'],
    };
    rerender(<CompletionScorePanel state={stateWithThreeTechs} />);
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('Technologies Added')).toBeInTheDocument();
  });

  it('handles social links condition correctly (+20% when at least one link is added)', () => {
    // Selected social but no link URL → 0%
    const stateWithSelectedOnly = {
      ...EMPTY_STATE,
      selectedSocials: ['github'],
      socialLinks: {},
    };
    const { rerender } = render(<CompletionScorePanel state={stateWithSelectedOnly} />);
    expect(screen.getByText('0%')).toBeInTheDocument();

    // Selected social with link URL → 20%
    const stateWithSocialLink = {
      ...EMPTY_STATE,
      selectedSocials: ['github'],
      socialLinks: { github: 'https://github.com/test' },
    };
    rerender(<CompletionScorePanel state={stateWithSocialLink} />);
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('Social Links Added')).toBeInTheDocument();
  });

  it('reaches Advanced level (61-80%) and Pro Developer level (81-100%) correctly', () => {
    // Advanced: Name (15) + Description (20) + Techs (25) + Github username (10) = 70%
    const advancedState = {
      ...EMPTY_STATE,
      name: 'Roshesh',
      description: 'Dev',
      selectedTechs: ['react', 'nextjs', 'typescript'],
      githubUsername: 'roshesh',
    };
    const { rerender } = render(<CompletionScorePanel state={advancedState} />);
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('Level: Advanced')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();

    // Pro Developer: Add Social Links (20) + CommitPulse Enabled (10) = 100%
    const proState = {
      ...advancedState,
      selectedSocials: ['twitter'],
      socialLinks: { twitter: 'https://twitter.com/test' },
      showCommitPulse: true,
    };
    rerender(<CompletionScorePanel state={proState} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Level: Pro Developer')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('is accessible and contains correct attributes', () => {
    render(<CompletionScorePanel state={EMPTY_STATE} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
  });
});
