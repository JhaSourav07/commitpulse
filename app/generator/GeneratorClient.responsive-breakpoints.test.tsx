import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeneratorClient } from './GeneratorClient';

vi.mock('./components/EditorPanel', () => ({
  EditorPanel: () => (
    <section
      data-testid="editor-panel"
      className="rounded-2xl border border-zinc-200 bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <h2>Editor Panel</h2>
      <p>Configure your README content with accessible contrast.</p>
    </section>
  ),
}));

vi.mock('./components/PreviewPanel', () => ({
  PreviewPanel: ({ markdown }: { markdown: string }) => (
    <section
      data-testid="preview-panel"
      className="rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <h2>Preview Panel</h2>
      <p>{markdown}</p>
    </section>
  ),
}));

function setMobileViewport() {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  });
  window.dispatchEvent(new Event('resize'));
}
describe('GeneratorClient responsive breakpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.className = '';
  });

  it('renders correctly for a standard 375px mobile viewport', () => {
    setMobileViewport();

    const { container } = render(<GeneratorClient />);

    const root = container.firstElementChild as HTMLElement;

    expect(root).toHaveClass('flex');
    expect(root).toHaveClass('flex-col');
    expect(root).toHaveClass('lg:flex-row');
    expect(root).toHaveClass('w-full');

    expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
  });
  it('stacks editor and preview into vertical columns on mobile', () => {
    setMobileViewport();

    const { container } = render(<GeneratorClient />);

    const root = container.firstElementChild as HTMLElement;
    const [editorColumn, previewColumn] = Array.from(root.children);

    expect(root).toHaveClass('flex-col');

    expect(editorColumn).toHaveClass('w-full');
    expect(previewColumn).toHaveClass('w-full');
  });
  it('avoids fixed-width layout classes that could cause horizontal scrolling', () => {
    setMobileViewport();

    const { container } = render(<GeneratorClient />);

    const root = container.firstElementChild as HTMLElement;
    const [editorColumn, previewColumn] = Array.from(root.children);

    expect(editorColumn).toHaveClass('w-full');
    expect(editorColumn).not.toHaveClass('w-screen');

    expect(previewColumn).toHaveClass('w-full');
    expect(previewColumn).not.toHaveClass('w-screen');
  });
  it('keeps editor and preview panels accessible on smaller viewports', () => {
    setMobileViewport();

    render(<GeneratorClient />);

    expect(screen.getByTestId('editor-panel')).toBeVisible();
    expect(screen.getByTestId('preview-panel')).toBeVisible();
  });
  it('keeps both layout columns inside the responsive container on mobile', () => {
    setMobileViewport();

    const { container } = render(<GeneratorClient />);

    const root = container.firstElementChild as HTMLElement;

    expect(root.children).toHaveLength(2);

    expect(root.firstElementChild).toHaveClass('w-full');
    expect(root.lastElementChild).toHaveClass('w-full');
  });
});
