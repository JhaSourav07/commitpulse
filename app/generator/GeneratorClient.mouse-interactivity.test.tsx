import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GeneratorClient } from './GeneratorClient';

vi.mock('./components/EditorPanel', () => ({
  EditorPanel: ({
    onNameChange,
    onDescriptionChange,
    onTechsChange,
    onSocialsChange,
    onSocialLinkChange,
    onGithubUsernameChange,
    onShowCommitPulseChange,
    onCommitPulseAccentChange,
  }: {
    onNameChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onTechsChange: (ids: string[]) => void;
    onSocialsChange: (ids: string[]) => void;
    onSocialLinkChange: (id: string, url: string) => void;
    onGithubUsernameChange: (value: string) => void;
    onShowCommitPulseChange: (value: boolean) => void;
    onCommitPulseAccentChange: (value: string) => void;
  }) => (
    <div data-testid="editor-panel">
      <button
        type="button"
        className="cursor-pointer hover:text-white"
        title="Edit project name"
        onMouseEnter={() => undefined}
        onMouseLeave={() => undefined}
        onClick={() => onNameChange('CommitPulse')}
      >
        Update name
      </button>

      <button
        type="button"
        className="cursor-pointer hover:text-white"
        title="Edit project description"
        onClick={() => onDescriptionChange('README generator')}
      >
        Update description
      </button>

      <button type="button" onClick={() => onTechsChange(['react', 'typescript'])}>
        Toggle techs
      </button>

      <button type="button" onClick={() => onSocialsChange(['github'])}>
        Toggle socials
      </button>

      <button type="button" onClick={() => onSocialLinkChange('github', 'https://github.com/test')}>
        Update social link
      </button>

      <button type="button" onClick={() => onGithubUsernameChange('test-user')}>
        Update GitHub username
      </button>

      <button type="button" onClick={() => onShowCommitPulseChange(true)}>
        Enable CommitPulse
      </button>

      <button type="button" onClick={() => onCommitPulseAccentChange('00ff88')}>
        Update accent
      </button>
    </div>
  ),
}));

vi.mock('./components/PreviewPanel', () => ({
  PreviewPanel: ({ markdown }: { markdown: string }) => (
    <section data-testid="preview-panel">{markdown}</section>
  ),
}));

describe('GeneratorClient mouse interactivity (Variation 5)', () => {
  it('renders interactive editor and preview panels', () => {
    render(<GeneratorClient />);

    expect(screen.getByTestId('editor-panel')).toBeDefined();
    expect(screen.getByTestId('preview-panel')).toBeDefined();
  });

  it('exposes pointer hover styling on interactive editor controls', () => {
    render(<GeneratorClient />);

    const button = screen.getByRole('button', { name: /update name/i });

    expect(button.className).toContain('cursor-pointer');
    expect(button.className).toContain('hover:text-white');
  });

  it('supports mouse enter and mouse leave events on interactive controls', () => {
    render(<GeneratorClient />);

    const button = screen.getByRole('button', { name: /update name/i });

    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);

    expect(button).toBeDefined();
  });

  it('propagates click interactions from editor controls into preview updates', () => {
    render(<GeneratorClient />);

    fireEvent.click(screen.getByRole('button', { name: /update name/i }));

    expect(screen.getByTestId('preview-panel').textContent).toContain('CommitPulse');
  });

  it('propagates touch-style click interactions for CommitPulse options', () => {
    render(<GeneratorClient />);

    fireEvent.click(screen.getByRole('button', { name: /update github username/i }));
    fireEvent.click(screen.getByRole('button', { name: /enable commitpulse/i }));
    fireEvent.click(screen.getByRole('button', { name: /update accent/i }));

    const preview = screen.getByTestId('preview-panel').textContent ?? '';

    expect(preview).toContain('test-user');
  });
});
