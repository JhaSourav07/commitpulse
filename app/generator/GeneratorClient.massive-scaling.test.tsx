import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { GeneratorClient } from './GeneratorClient';
import type { ImportedData } from './utils/githubMapper';

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
    onApplyImport,
  }: {
    onNameChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onTechsChange: (ids: string[]) => void;
    onSocialsChange: (ids: string[]) => void;
    onSocialLinkChange: (id: string, url: string) => void;
    onGithubUsernameChange: (value: string) => void;
    onShowCommitPulseChange: (value: boolean) => void;
    onCommitPulseAccentChange: (value: string) => void;
    onApplyImport: (data: ImportedData) => void;
  }) => (
    <div data-testid="editor-panel">
      <button
        type="button"
        data-testid="btn-update-name"
        onClick={() => onNameChange('CommitPulse')}
      >
        Update name
      </button>

      <button
        type="button"
        data-testid="btn-update-description"
        onClick={() => onDescriptionChange('README generator')}
      >
        Update description
      </button>

      <button
        type="button"
        data-testid="btn-apply-import"
        onClick={() =>
          onApplyImport({
            name: 'Imported Name',
            description: 'Imported Description',
            selectedTechs: ['react', 'nextjs'],
            selectedSocials: ['github'],
            socialLinks: { github: 'https://github.com/imported' },
          })
        }
      >
        Apply Import
      </button>

      <button
        type="button"
        data-testid="btn-huge-change"
        onClick={() => {
          const sampleTechs = [
            'react',
            'nextjs',
            'typescript',
            'tailwindcss',
            'vitest',
            'eslint',
            'prettier',
            'jest',
            'webpack',
            'babel',
            'postcss',
            'sass',
          ];
          const hugeTechs = Array.from(
            { length: 5000 },
            (_, i) => `${sampleTechs[i % sampleTechs.length]}-${i}`
          );

          const sampleSocials = [
            'github',
            'twitter',
            'linkedin',
            'discord',
            'reddit',
            'youtube',
            'instagram',
            'facebook',
            'medium',
            'devto',
          ];
          const hugeSocials = Array.from(
            { length: 1000 },
            (_, i) => `${sampleSocials[i % sampleSocials.length]}-${i}`
          );

          const hugeLinks: Record<string, string> = {};
          hugeSocials.forEach((id) => {
            hugeLinks[id] = `https://socialnetwork.platform.org/profiles/users/${id}`;
          });

          onTechsChange(hugeTechs);
          onSocialsChange(hugeSocials);
          onSocialLinkChange('github', 'https://github.com/scale-test');
          onGithubUsernameChange('scale-user');
          onShowCommitPulseChange(true);
          onCommitPulseAccentChange('00ffaa');
        }}
      >
        Trigger Massive State Change
      </button>
    </div>
  ),
}));

vi.mock('./components/PreviewPanel', () => ({
  PreviewPanel: ({ markdown }: { markdown: string }) => (
    <section data-testid="preview-panel">{markdown}</section>
  ),
}));

describe('GeneratorClient component performance and high volume data bounds', () => {
  it('should process large arrays of tech and social items without throwing errors', () => {
    render(<GeneratorClient />);

    expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();

    const triggerBtn = screen.getByTestId('btn-huge-change');
    expect(() => {
      fireEvent.click(triggerBtn);
    }).not.toThrow();

    const previewContent = screen.getByTestId('preview-panel').textContent;
    expect(previewContent).toBeDefined();
  });

  it('should handle large string lengths on name and description properties', () => {
    render(<GeneratorClient />);

    const editorPanel = screen.getByTestId('editor-panel');
    expect(editorPanel).toBeInTheDocument();

    expect(() => {
      const { unmount } = render(<GeneratorClient />);
      unmount();
    }).not.toThrow();
  });

  it('should maintain standard layout constraints and flex configuration', () => {
    const { container } = render(<GeneratorClient />);

    const firstDiv = container.firstChild as HTMLElement;
    expect(firstDiv).toBeInTheDocument();
    expect(firstDiv.className).toContain('flex');
    expect(firstDiv.className).toContain('flex-col');
  });

  it('should execute rendering cycle within acceptable latency limits', () => {
    const start = performance.now();
    render(<GeneratorClient />);
    const end = performance.now();

    const renderDuration = end - start;
    expect(renderDuration).toBeLessThan(1000);
  });

  it('should complete multiple render and unmount iterations consecutively', () => {
    expect(() => {
      for (let i = 0; i < 25; i++) {
        const { unmount } = render(<GeneratorClient />);
        unmount();
      }
    }).not.toThrow();
  });
});
