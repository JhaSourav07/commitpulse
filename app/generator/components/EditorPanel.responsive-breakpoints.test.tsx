import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorPanel } from './EditorPanel';

// Mock the nested components to isolate the layout testing of EditorPanel itself
vi.mock('./sections/NameSection', () => ({
  NameSection: () => <div data-testid="name-section">Name Section</div>,
}));
vi.mock('./sections/DescriptionSection', () => ({
  DescriptionSection: () => <div data-testid="description-section">Description Section</div>,
}));
vi.mock('./sections/TechnologiesSection', () => ({
  TechnologiesSection: () => <div data-testid="technologies-section">Technologies Section</div>,
}));
vi.mock('./sections/SocialsSection', () => ({
  SocialsSection: () => <div data-testid="socials-section">Socials Section</div>,
}));
vi.mock('./sections/CommitPulseSection', () => ({
  CommitPulseSection: () => <div data-testid="commit-pulse-section">Commit Pulse Section</div>,
}));
vi.mock('./sections/RepoSpotlightSection', () => ({
  RepoSpotlightSection: () => (
    <div data-testid="repo-spotlight-section">Repo Spotlight Section</div>
  ),
}));
vi.mock('./sections/ContributionGraphSection', () => ({
  ContributionGraphSection: () => (
    <div data-testid="contribution-graph-section">Contribution Graph Section</div>
  ),
}));
vi.mock('./GitHubImportModal', () => ({
  GitHubImportModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? (
      <div data-testid="import-modal-open">Modal Open</div>
    ) : (
      <div data-testid="import-modal-closed">Modal Closed</div>
    ),
}));

describe('EditorPanel - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  const defaultState = {
    name: 'John Doe',
    description: 'A developer',
    selectedTechs: [],
    selectedSocials: [],
    socialLinks: {},
    githubUsername: 'johndoe',
    showCommitPulse: true,
    commitPulseAccent: 'emerald',
    showSnakeGraph: true,
    showPacmanGraph: false,
    graphPlacement: 'top' as const,
    showRepoSpotlight: false,
    spotlightRepo: '',
  };

  const defaultProps = {
    state: defaultState,
    onNameChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onTechsChange: vi.fn(),
    onSocialsChange: vi.fn(),
    onSocialLinkChange: vi.fn(),
    onGithubUsernameChange: vi.fn(),
    onShowCommitPulseChange: vi.fn(),
    onCommitPulseAccentChange: vi.fn(),
    onShowSnakeGraphChange: vi.fn(),
    onShowPacmanGraphChange: vi.fn(),
    onGraphPlacementChange: vi.fn(),
    onShowRepoSpotlightChange: vi.fn(),
    onSpotlightRepoChange: vi.fn(),
    onApplyImport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Mock standard mobile-width media coordinates (e.g. 375px wide viewports)', () => {
    // Override window innerWidth to simulate mobile device viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    // Simulate window resize event to trigger any viewport-dependent logic
    window.dispatchEvent(new Event('resize'));

    render(<EditorPanel {...defaultProps} />);

    const formElement = screen.getByRole('form', { name: 'Readme Configuration Editor' });
    expect(formElement).toBeDefined();
    expect(window.innerWidth).toBe(375);
  });

  it('2. Assert that columns reflow into standard vertical flex lists', () => {
    render(<EditorPanel {...defaultProps} />);

    const formElement = screen.getByRole('form', { name: 'Readme Configuration Editor' });

    // Check that the form has standard vertical flex layout classes
    expect(formElement.className).toContain('flex');
    expect(formElement.className).toContain('flex-col');
    expect(formElement.className).toContain('gap-4');

    // Ensure horizontal classes are not applied by default which would break reflow
    expect(formElement.className).not.toContain('flex-row');
  });

  it('3. Verify styling values are not absolute widths that cause horizontal scrollbars on smaller viewports', () => {
    render(<EditorPanel {...defaultProps} />);

    const formElement = screen.getByRole('form', { name: 'Readme Configuration Editor' });
    const importButton = screen.getByRole('button', { name: /Import from GitHub/i });

    // Verify responsive width utility instead of hardcoded absolute pixels
    expect(importButton.className).toContain('w-full');
    expect(importButton.className).not.toMatch(/w-\[\d+px\]/);

    // Form element itself should implicitly take up full width without absolute constraints
    expect(formElement.className).not.toMatch(/w-\[\d+px\]/);
  });

  it('4. Check that navigation components scale down gracefully', () => {
    render(<EditorPanel {...defaultProps} />);

    const importButton = screen.getByRole('button', { name: /Import from GitHub/i });

    // The button padding should be responsive or reasonable for small screens
    expect(importButton.className).toContain('px-4');
    expect(importButton.className).toContain('py-3.5');

    // Text scale should be appropriate
    expect(importButton.innerHTML).toContain('text-sm');
  });

  it('5. Assert mobile-specific toggle states respond cleanly', () => {
    render(<EditorPanel {...defaultProps} />);

    // Initial state: Modal should be closed
    expect(screen.getByTestId('import-modal-closed')).toBeDefined();

    // Simulate mobile touch / click on import button
    const importButton = screen.getByRole('button', { name: /Import from GitHub/i });
    fireEvent.click(importButton);

    // The modal state should respond cleanly
    expect(screen.getByTestId('import-modal-open')).toBeDefined();
  });
});
