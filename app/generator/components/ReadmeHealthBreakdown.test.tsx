import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { ReadmeHealthBreakdown } from './ReadmeHealthBreakdown';
import type { GeneratorState } from '../types';

const createState = (overrides: Partial<GeneratorState> = {}): GeneratorState =>
  ({
    name: '',
    description: '',
    selectedTechs: [],
    selectedSocials: [],
    socialLinks: {},
    githubUsername: '',
    showCommitPulse: false,
    ...overrides,
  }) as GeneratorState;

describe('ReadmeHealthBreakdown', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the health breakdown header', () => {
    render(<ReadmeHealthBreakdown state={createState()} />);

    expect(screen.getByLabelText('README Health Breakdown')).toBeInTheDocument();
    expect(screen.getByText('README Health Breakdown')).toBeInTheDocument();
  });

  it('calculates and displays the correct completion percentage', () => {
    render(
      <ReadmeHealthBreakdown
        state={createState({
          name: 'test user',
          description: 'example desc',
          githubUsername: 'octocat',
          showCommitPulse: true,
        })}
      />
    );

    // 4 of 6 items completed = 67%
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('renders completed and incomplete checklist items', () => {
    render(
      <ReadmeHealthBreakdown
        state={createState({
          name: 'test user',
          githubUsername: 'octocat',
        })}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Technologies')).toBeInTheDocument();
    expect(screen.getByText('Social Links')).toBeInTheDocument();
    expect(screen.getByText('GitHub Username')).toBeInTheDocument();
    expect(screen.getByText('CommitPulse Badge')).toBeInTheDocument();
  });

  it('renders quick fix buttons only for incomplete sections', () => {
    render(
      <ReadmeHealthBreakdown
        state={createState({
          name: 'test user',
        })}
      />
    );

    expect(screen.getByText('Quick Fixes')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: '+ Add Name' })).toBeNull();

    expect(screen.getByRole('button', { name: '+ Add Description' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: '+ Add Technologies' })).toBeInTheDocument();
  });

  it('scrolls to the corresponding section when a quick fix button is clicked', () => {
    const scrollIntoView = vi.fn();

    const target = document.createElement('div');
    target.id = 'description-section';
    target.scrollIntoView = scrollIntoView;

    document.body.appendChild(target);

    render(
      <ReadmeHealthBreakdown
        state={createState({
          name: 'test user',
        })}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Add Description' }));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });

    document.body.removeChild(target);
  });
});
