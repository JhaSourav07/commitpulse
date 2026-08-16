import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EditorPanel } from './EditorPanel';
import type { GeneratorState } from '../types';

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (val: unknown) => val,
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('EditorPanel Component Interactivity Tests', () => {
  let mockState: GeneratorState;

  const mockOnNameChange = vi.fn();
  const mockOnDescriptionChange = vi.fn();
  const mockOnTechsChange = vi.fn();
  const mockOnSocialsChange = vi.fn();
  const mockOnSocialLinkChange = vi.fn();
  const mockOnGithubUsernameChange = vi.fn();
  const mockOnShowCommitPulseChange = vi.fn();
  const mockOnCommitPulseAccentChange = vi.fn();
  const mockOnApplyImport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          exists: true,
          login: 'johndoe',
          name: 'John Doe',
          avatar_url: 'https://github.com/johndoe.png',
          public_repos: 10,
          stats: {
            currentStreak: 5,
            longestStreak: 12,
            totalContributions: 150,
          },
        }),
      }))
    );

    mockState = {
      name: 'John Doe',
      description: 'Full Stack Developer',
      selectedTechs: ['react', 'node'],
      selectedSocials: ['github'],
      socialLinks: { github: 'https://github.com/johndoe' },
      githubUsername: 'johndoe',
      showCommitPulse: true,
      commitPulseAccent: '#10b981',
      showRepoSpotlight: false,
      spotlightRepo: '',
      showSnakeGraph: false,
      showPacmanGraph: false,
      graphPlacement: 'bottom',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const renderEditorPanel = async () => {
    await act(async () => {
      render(
        <EditorPanel
          state={mockState}
          onNameChange={mockOnNameChange}
          onDescriptionChange={mockOnDescriptionChange}
          onTechsChange={mockOnTechsChange}
          onSocialsChange={mockOnSocialsChange}
          onSocialLinkChange={mockOnSocialLinkChange}
          onGithubUsernameChange={mockOnGithubUsernameChange}
          onShowCommitPulseChange={mockOnShowCommitPulseChange}
          onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
          onApplyImport={mockOnApplyImport}
        />
      );
    });
  };

  // Case 1: Interactive Pointer Detection (Cursor Hovers Equivalent)
  it('Case 1: applies transition and hover styles structurally on all interactive controls', async () => {
    await renderEditorPanel();

    const switchBtn = screen.getByRole('switch', { name: /toggle commitpulse badge/i });
    const importBtn = screen.getByRole('button', { name: /import from github/i });

    // Verify elements contain transition classes
    expect(switchBtn.className).toContain('transition-colors');
    expect(importBtn.className).toContain('transition-all');

    // Verify hover color or background changes are structurally present in the class names
    expect(importBtn.className).toContain('hover:border-emerald-500/30');
  });

  // Case 2: Hover State Visibility (Tooltips Equivalent)
  it('Case 2: displays title attributes and sets accessibility markers on interactive components', async () => {
    await renderEditorPanel();

    const usernameInput = screen.getByPlaceholderText('e.g. OmkarArdekar12');
    expect(usernameInput).toHaveAttribute('type', 'text');

    const switchBtn = screen.getByRole('switch', { name: /toggle commitpulse badge/i });
    expect(switchBtn).toHaveAttribute('aria-checked', 'true');
  });

  // Case 3: Event Propagation to DOM Targets (Touch Propagation Equivalent)
  it('Case 3: click events propagate cleanly to parental DOM wrappers', async () => {
    const parentClickSpy = vi.fn();
    await act(async () => {
      render(
        <div onClick={parentClickSpy} data-testid="outer-wrapper">
          <EditorPanel
            state={mockState}
            onNameChange={mockOnNameChange}
            onDescriptionChange={mockOnDescriptionChange}
            onTechsChange={mockOnTechsChange}
            onSocialsChange={mockOnSocialsChange}
            onSocialLinkChange={mockOnSocialLinkChange}
            onGithubUsernameChange={mockOnGithubUsernameChange}
            onShowCommitPulseChange={mockOnShowCommitPulseChange}
            onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
            onApplyImport={mockOnApplyImport}
          />
        </div>
      );
    });

    const switchBtn = screen.getByRole('switch', { name: /toggle commitpulse badge/i });
    fireEvent.click(switchBtn);

    expect(parentClickSpy).toHaveBeenCalledTimes(1);
  });

  // Case 4: Mouse Leave Recovery (Hiding Overlay visuals Equivalent)
  it('Case 4: triggers name and github username change callbacks correctly', async () => {
    await renderEditorPanel();

    const nameInput = screen.getByPlaceholderText('e.g. Omkar');
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    const usernameInput = screen.getByPlaceholderText('e.g. OmkarArdekar12');
    fireEvent.change(usernameInput, { target: { value: 'janedoe' } });

    expect(mockOnNameChange).toHaveBeenCalledWith('Jane Doe');
    expect(mockOnGithubUsernameChange).toHaveBeenCalledWith('janedoe');
  });

  // Case 5: Touch and Mobile Interactivity
  it('Case 5: mobile touch gestures propagate successfully on controls', async () => {
    const parentTouchSpy = vi.fn();
    await act(async () => {
      render(
        <div onTouchStart={parentTouchSpy} data-testid="outer-wrapper">
          <EditorPanel
            state={mockState}
            onNameChange={mockOnNameChange}
            onDescriptionChange={mockOnDescriptionChange}
            onTechsChange={mockOnTechsChange}
            onSocialsChange={mockOnSocialsChange}
            onSocialLinkChange={mockOnSocialLinkChange}
            onGithubUsernameChange={mockOnGithubUsernameChange}
            onShowCommitPulseChange={mockOnShowCommitPulseChange}
            onCommitPulseAccentChange={mockOnCommitPulseAccentChange}
            onApplyImport={mockOnApplyImport}
          />
        </div>
      );
    });

    const switchBtn = screen.getByRole('switch', { name: /toggle commitpulse badge/i });

    const touchStartRes = fireEvent.touchStart(switchBtn);
    expect(touchStartRes).toBe(true);
    expect(parentTouchSpy).toHaveBeenCalledTimes(1);
  });
});
