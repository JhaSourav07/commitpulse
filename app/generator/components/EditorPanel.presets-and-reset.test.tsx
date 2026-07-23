import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorPanel } from './EditorPanel';
import type { GeneratorState } from '../types';

const mockState: GeneratorState = {
  name: 'Original Name',
  description: 'Original Description',
  selectedTechs: ['react', 'nextjs'],
  selectedSocials: ['github'],
  socialLinks: { github: 'https://github.com/user' },
  githubUsername: 'user',
  showCommitPulse: true,
  commitPulseAccent: '10b981',
  showSnakeGraph: true,
  showPacmanGraph: false,
  graphPlacement: 'bottom',
  showRepoSpotlight: false,
  spotlightRepo: '',
  showArticles: false,
  articlesPlatform: 'devto',
  articlesUsername: '',
};

describe('EditorPanel Section Reset & Profile Presets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Profile Presets section and options', () => {
    render(
      <EditorPanel
        state={mockState}
        onNameChange={vi.fn()}
        onDescriptionChange={vi.fn()}
        onTechsChange={vi.fn()}
        onSocialsChange={vi.fn()}
        onSocialLinkChange={vi.fn()}
        onGithubUsernameChange={vi.fn()}
        onShowCommitPulseChange={vi.fn()}
        onCommitPulseAccentChange={vi.fn()}
        onApplyImport={vi.fn()}
        onApplyPreset={vi.fn()}
      />
    );

    expect(screen.getByText('Profile Presets')).toBeInTheDocument();
    expect(screen.getByText('Full-Stack Developer')).toBeInTheDocument();
    expect(screen.getByText('Open Source Maintainer')).toBeInTheDocument();
    expect(screen.getByText('Data Scientist & AI Engineer')).toBeInTheDocument();
    expect(screen.getByText('Frontend Specialist & UI Engineer')).toBeInTheDocument();
  });

  it('calls onApplyPreset when a preset button is clicked', () => {
    const onApplyPresetMock = vi.fn();
    render(
      <EditorPanel
        state={mockState}
        onNameChange={vi.fn()}
        onDescriptionChange={vi.fn()}
        onTechsChange={vi.fn()}
        onSocialsChange={vi.fn()}
        onSocialLinkChange={vi.fn()}
        onGithubUsernameChange={vi.fn()}
        onShowCommitPulseChange={vi.fn()}
        onCommitPulseAccentChange={vi.fn()}
        onApplyImport={vi.fn()}
        onApplyPreset={onApplyPresetMock}
      />
    );

    fireEvent.click(screen.getByText('Full-Stack Developer'));

    expect(onApplyPresetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Hi 👋, I'm a Full-Stack Developer",
        showCommitPulse: true,
      })
    );
  });

  it('triggers onReset when SectionCard reset button is clicked', () => {
    const onNameChangeMock = vi.fn();
    render(
      <EditorPanel
        state={mockState}
        onNameChange={onNameChangeMock}
        onDescriptionChange={vi.fn()}
        onTechsChange={vi.fn()}
        onSocialsChange={vi.fn()}
        onSocialLinkChange={vi.fn()}
        onGithubUsernameChange={vi.fn()}
        onShowCommitPulseChange={vi.fn()}
        onCommitPulseAccentChange={vi.fn()}
        onApplyImport={vi.fn()}
        onApplyPreset={vi.fn()}
      />
    );

    const nameResetBtn = screen.getByTitle('Reset Name Section');
    expect(nameResetBtn).toBeInTheDocument();

    fireEvent.click(nameResetBtn);

    expect(onNameChangeMock).toHaveBeenCalledWith('');
  });
});
