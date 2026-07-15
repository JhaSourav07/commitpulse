import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { EditorPanel } from './EditorPanel';
import React from 'react';
import type { GeneratorState } from '../types';

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: () => '',
}));

const mockState: GeneratorState = {
  name: 'John Doe',
  description: 'Full-stack developer',
  selectedTechs: ['react', 'typescript'],
  selectedSocials: ['github', 'twitter'],
  socialLinks: {
    github: 'https://github.com/johndoe',
    twitter: 'https://twitter.com/johndoe',
  },
  githubUsername: 'johndoe',
  showCommitPulse: true,
  commitPulseAccent: '10b981',
  showRepoSpotlight: false,
  spotlightRepo: '',
  showSnakeGraph: false,
  showPacmanGraph: false,
  graphPlacement: 'middle',
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

describe('EditorPanel Component Accessibility Tests', () => {
  // Test 1: Landmark and Region Roles
  it('1. verifies that the root container has a form landmark and SectionCards use region roles with h3 headings', () => {
    render(<EditorPanel state={mockState} {...mockHandlers} />);

    // Root form landmark
    const form = screen.getByRole('form', { name: /readme configuration editor/i });
    expect(form).toBeInTheDocument();

    // Section card heading hierarchy (h3) and regions

    const headerButton = screen.getByRole('button', {
      name: /your display name for the readme header/i,
    });

    const nameRegion = screen.getByRole('region', {
      name: /your display name for the readme header/i,
    });

    expect(nameRegion).toHaveAttribute('aria-labelledby', headerButton.id);
  });

  // Test 2: Label to Input Pairings
  it('2. verifies that text inputs, textareas, and selection fields have properly associated labels via htmlFor', () => {
    render(<EditorPanel state={mockState} {...mockHandlers} />);

    // Display Name input and label
    const nameLabel = screen.getByText(/^display name$/i);
    expect(nameLabel).toHaveAttribute('for', 'editor-display-name');
    const nameInput = screen.getByLabelText(/^display name$/i);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('id', 'editor-display-name');

    // Bio / Tagline textarea and label
    const bioLabel = screen.getByText(/^bio \/ tagline$/i);
    expect(bioLabel).toHaveAttribute('for', 'editor-bio');
    const bioInput = screen.getByLabelText(/^bio \/ tagline$/i);
    expect(bioInput).toBeInTheDocument();
    expect(bioInput).toHaveAttribute('id', 'editor-bio');

    // GitHub Username input and label
    const usernameLabel = screen.getByText(/^github username$/i);
    expect(usernameLabel).toHaveAttribute('for', 'commitpulse-username');
    const usernameInput = screen.getByLabelText(/^github username$/i);
    expect(usernameInput).toBeInTheDocument();
    expect(usernameInput).toHaveAttribute('id', 'commitpulse-username');
  });

  // Test 3: ARIA Tab Roles & Mappings
  it('3. verifies correct tablist, tab, and tabpanel mappings inside sections like SocialsSection', () => {
    render(<EditorPanel state={mockState} {...mockHandlers} />);

    // Tablist element in SocialsSection
    const tablist = screen.getByRole('tablist', { name: /socials settings tabs/i });
    expect(tablist).toBeInTheDocument();

    // Tabs
    const pickTab = screen.getByRole('tab', { name: /pick platforms/i });
    const linksTab = screen.getByRole('tab', { name: /add links/i });
    expect(pickTab).toBeInTheDocument();
    expect(linksTab).toBeInTheDocument();

    // Mappings and active states
    expect(pickTab).toHaveAttribute('aria-selected', 'true');
    expect(linksTab).toHaveAttribute('aria-selected', 'false');

    const pickPanel = screen.getByRole('tabpanel', { name: /pick platforms/i });
    expect(pickPanel).toBeInTheDocument();
    expect(pickPanel).toHaveAttribute('id', 'panel-social-pick');
    expect(pickPanel).toHaveAttribute('aria-labelledby', 'tab-social-pick');
  });

  // Test 4: Keyboard Accessibility (Focus Management)
  it('4. verifies interactive elements can receive focus', () => {
    render(<EditorPanel state={mockState} {...mockHandlers} />);

    const nameInput = screen.getByLabelText(/^display name$/i);
    const bioInput = screen.getByLabelText(/^bio \/ tagline$/i);
    const usernameInput = screen.getByLabelText(/^github username$/i);

    // Test focus transitions
    nameInput.focus();
    expect(document.activeElement).toBe(nameInput);

    bioInput.focus();
    expect(document.activeElement).toBe(bioInput);

    usernameInput.focus();
    expect(document.activeElement).toBe(usernameInput);
  });

  // Test 5: Dynamic Interaction State Changes (Collapsing Sections)
  it('5. verifies that the SectionCard header updates aria-expanded states correctly when toggled', () => {
    render(<EditorPanel state={mockState} {...mockHandlers} />);

    const headerButton = screen.getByRole('button', {
      name: /your display name for the readme header/i,
    });
    expect(headerButton).toHaveAttribute('aria-expanded', 'true');

    // Collapse panel
    fireEvent.click(headerButton);
    expect(headerButton).toHaveAttribute('aria-expanded', 'false');

    // Confirm that region content panel is removed or hidden
    const nameRegion = screen.queryByRole('region', { name: /name/i });
    expect(nameRegion).toBeNull();
  });
});
