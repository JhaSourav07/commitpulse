import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditorPanel } from './EditorPanel';
import type { GeneratorState } from '../types';

// 1. Mock all child sections cleanly with proper TypeScript definitions to avoid no-explicit-any errors
vi.mock('./sections/NameSection', () => ({
  NameSection: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div data-testid="name-sec">
      <input data-testid="name-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  ),
}));

vi.mock('./sections/DescriptionSection', () => ({
  DescriptionSection: ({ value }: { value: string }) => (
    <div data-testid="desc-sec" data-value={value} />
  ),
}));

vi.mock('./sections/TechnologiesSection', () => ({
  // Accept string array for selections smoothly
  TechnologiesSection: ({ selected }: { selected: string[] }) => (
    <div data-testid="tech-sec" data-count={selected.length} />
  ),
}));

vi.mock('./sections/SocialsSection', () => ({
  SocialsSection: ({ selected }: { selected: string[] }) => (
    <div data-testid="social-sec" data-count={selected.length} />
  ),
}));

vi.mock('./sections/CommitPulseSection', () => ({
  CommitPulseSection: ({
    githubUsername,
    showCommitPulse,
  }: {
    githubUsername: string;
    showCommitPulse: boolean;
  }) => (
    <div data-testid="pulse-sec" data-username={githubUsername} data-visible={showCommitPulse} />
  ),
}));

vi.mock('./sections/ContributionGraphSection', () => ({
  ContributionGraphSection: ({
    graphPlacement,
    showSnakeGraph,
  }: {
    graphPlacement: 'top' | 'middle' | 'bottom';
    showSnakeGraph: boolean;
  }) => <div data-testid="graph-sec" data-placement={graphPlacement} data-snake={showSnakeGraph} />,
}));

vi.mock('./sections/RepoSpotlightSection', () => ({
  RepoSpotlightSection: ({ spotlightRepo }: { spotlightRepo: string }) => (
    <div data-testid="spotlight-sec" data-repo={spotlightRepo} />
  ),
}));

vi.mock('./sections/ArticlesSection', () => ({
  ArticlesSection: ({
    showArticles,
    articlesPlatform,
  }: {
    showArticles: boolean;
    articlesPlatform: 'devto' | 'hashnode';
  }) => (
    <div data-testid="articles-sec" data-visible={showArticles} data-platform={articlesPlatform} />
  ),
}));

vi.mock('./GitHubImportModal', () => ({
  GitHubImportModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="import-modal" data-open={isOpen}>
      <button data-testid="close-modal-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

describe('EditorPanel - Prop Forwarding, Layout Stability & Timezone Context Boundaries', () => {
  const mockState: GeneratorState = {
    name: 'Octocat Profile',
    description: 'Open source contributor',
    selectedTechs: ['react', 'typescript'],
    selectedSocials: ['github'],
    socialLinks: { github: 'https://github.com/octocat' },
    githubUsername: 'octocat',
    showCommitPulse: true,
    commitPulseAccent: '10b981',
    showRepoSpotlight: true,
    spotlightRepo: 'hello-world',
    showSnakeGraph: true,
    showPacmanGraph: false,
    graphPlacement: 'middle',
    showArticles: true,
    articlesPlatform: 'devto',
    articlesUsername: 'octocat_dev',
  };

  const mockHandlers = {
    onNameChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onTechsChange: vi.fn(),
    onSocialsChange: vi.fn(),
    onSocialLinkChange: vi.fn(),
    onGithubUsernameChange: vi.fn(),
    onShowCommitPulseChange: vi.fn(),
    onCommitPulseAccentChange: vi.fn(),
    onApplyImport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Container Orchestration & Mounting Verification
  it('renders the core form wrapper layout cleanly with structural accessibility markers', () => {
    render(<EditorPanel state={mockState} {...mockHandlers} />);
    expect(screen.getByRole('form', { name: /Readme Configuration Editor/i })).toBeInTheDocument();
  });

  // Test 2: Primary Data Prop Forwarding Mechanics
  it('accurately forwards primary text state configuration values down to individual section nodes', () => {
    render(<EditorPanel state={mockState} {...mockHandlers} />);

    const descSection = screen.getByTestId('desc-sec');
    expect(descSection).toHaveAttribute('data-value', 'Open source contributor');

    const techSection = screen.getByTestId('tech-sec');
    expect(techSection).toHaveAttribute('data-count', '2');
  });

  // Test 3: Advanced Section Alignment Contexts (Graphs & Placements)
  it('passes graph alignment values and calendar block layouts safely down to component containers', () => {
    render(<EditorPanel state={mockState} {...mockHandlers} />);

    const graphSection = screen.getByTestId('graph-sec');
    expect(graphSection).toHaveAttribute('data-placement', 'middle');
    expect(graphSection).toHaveAttribute('data-snake', 'true');
  });

  // Test 4: Interactive Modal Trigger State Management Loops
  it('opens and closes the GitHub import overlay panel cleanly upon receiving click events', () => {
    render(<EditorPanel state={mockState} {...mockHandlers} />);

    expect(screen.getByTestId('import-modal')).toHaveAttribute('data-open', 'false');

    const importButton = screen.getByRole('button', { name: /Import from GitHub/i });
    fireEvent.click(importButton);
    expect(screen.getByTestId('import-modal')).toHaveAttribute('data-open', 'true');

    const closeBtn = screen.getByTestId('close-modal-btn');
    fireEvent.click(closeBtn);
    expect(screen.getByTestId('import-modal')).toHaveAttribute('data-open', 'false');
  });

  // Test 5: Optional Calendar Platform Fields Recovery Fallbacks
  it('handles empty or missing optional structural fields smoothly without throwing exceptions', () => {
    const brokenState: GeneratorState = {
      ...mockState,
      showArticles: undefined,
      articlesPlatform: undefined,
      articlesUsername: undefined,
    };

    render(<EditorPanel state={brokenState} {...mockHandlers} />);

    const articlesSection = screen.getByTestId('articles-sec');
    expect(articlesSection).toHaveAttribute('data-visible', 'false');
    expect(articlesSection).toHaveAttribute('data-platform', 'devto');
  });
});
