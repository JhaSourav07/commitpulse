import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EditorPanel } from './EditorPanel';
import type { GeneratorState } from '../types';

vi.mock('./sections/NameSection', () => ({
  NameSection: () => React.createElement('div', null, 'NameSection'),
}));

vi.mock('./sections/DescriptionSection', () => ({
  DescriptionSection: () => React.createElement('div', null, 'DescriptionSection'),
}));

vi.mock('./sections/TechnologiesSection', () => ({
  TechnologiesSection: () => React.createElement('div', null, 'TechnologiesSection'),
}));

vi.mock('./sections/SocialsSection', () => ({
  SocialsSection: () => React.createElement('div', null, 'SocialsSection'),
}));

vi.mock('./sections/CommitPulseSection', () => ({
  CommitPulseSection: () => React.createElement('div', null, 'CommitPulseSection'),
}));

vi.mock('./GitHubImportModal', () => ({
  GitHubImportModal: () => React.createElement('div', null, 'GitHubImportModal'),
}));

describe('EditorPanel Theme Contrast', () => {
  const mockState: GeneratorState = {
    name: '',
    description: '',
    selectedTechs: [],
    selectedSocials: [],
    socialLinks: {},
    githubUsername: '',
    showCommitPulse: false,
    commitPulseAccent: '',

    // Required GeneratorState fields
    showSnakeGraph: false,
    showPacmanGraph: false,
    graphPlacement: 'bottom',
  };
  const defaultProps = {
    state: mockState,
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

  it('renders GitHub import button', () => {
    render(<EditorPanel {...defaultProps} />);

    expect(
      screen.getByRole('button', {
        name: /import from github/i,
      })
    ).toBeInTheDocument();
  });

  it('applies light theme contrast classes', () => {
    render(<EditorPanel {...defaultProps} />);

    const button = screen.getByRole('button', {
      name: /import from github/i,
    });

    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('border-gray-200');
  });

  it('applies dark theme contrast classes', () => {
    render(<EditorPanel {...defaultProps} />);

    const button = screen.getByRole('button', {
      name: /import from github/i,
    });

    expect(button).toHaveClass('dark:bg-[#111111]');
    expect(button).toHaveClass('dark:border-white/10');
  });

  it('renders contrast-aware label styling', () => {
    render(<EditorPanel {...defaultProps} />);

    const label = screen.getByText('Import from GitHub');

    expect(label).toHaveClass('text-gray-700');
    expect(label).toHaveClass('dark:text-white/80');
  });

  it('includes hover contrast styles', () => {
    render(<EditorPanel {...defaultProps} />);

    const button = screen.getByRole('button', {
      name: /import from github/i,
    });

    expect(button.className).toContain('hover:border-emerald-500/30');
    expect(button.className).toContain('dark:hover:border-emerald-500/30');
  });
});
