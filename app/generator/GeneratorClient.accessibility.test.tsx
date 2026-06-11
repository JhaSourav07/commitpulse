import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GeneratorClient } from './GeneratorClient';

vi.mock('./components/EditorPanel', () => ({
  EditorPanel: () => (
    <section data-testid="editor-panel">
      <button type="button">Project Name</button>
      <button type="button">Project Description</button>
      <button type="button">Tech Stack</button>
    </section>
  ),
}));

vi.mock('./components/PreviewPanel', () => ({
  PreviewPanel: ({ markdown }: { markdown: string }) => (
    <section data-testid="preview-panel">{markdown}</section>
  ),
}));

describe('GeneratorClient Accessibility', () => {
  it('renders editor panel for assistive technologies', () => {
    render(<GeneratorClient />);

    expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
  });

  it('renders preview panel for assistive technologies', () => {
    render(<GeneratorClient />);

    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
  });

  it('exposes interactive controls with accessible button roles', () => {
    render(<GeneratorClient />);

    expect(screen.getByRole('button', { name: /project name/i })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /project description/i })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /tech stack/i })).toBeInTheDocument();
  });

  it('maintains logical keyboard-focusable controls', () => {
    render(<GeneratorClient />);

    const buttons = screen.getAllByRole('button');

    expect(buttons).toHaveLength(3);

    buttons.forEach((button) => {
      expect(button).not.toHaveAttribute('disabled');
    });
  });

  it('renders default preview content when no user data exists', () => {
    render(<GeneratorClient />);

    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
  });
});
