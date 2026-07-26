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

function setPreferredColorScheme(theme: 'dark' | 'light') {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === `(prefers-color-scheme: ${theme})`,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('GeneratorClient theme contrast', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.className = '';
  });

  it('renders editor and preview regions in a dark prefers-color-scheme environment', () => {
    setPreferredColorScheme('dark');
    document.documentElement.classList.add('dark');

    render(<GeneratorClient />);

    expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
  });

  it('renders editor and preview regions in a light prefers-color-scheme environment', () => {
    setPreferredColorScheme('light');
    document.documentElement.classList.remove('dark');

    render(<GeneratorClient />);

    expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
    expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('keeps responsive layout classes active for visual cohesion', () => {
    const { container } = render(<GeneratorClient />);
    const root = container.firstElementChild;

    expect(root).toHaveClass('flex');
    expect(root).toHaveClass('flex-col');
    expect(root).toHaveClass('lg:flex-row');
    expect(root).toHaveClass('gap-5');
    expect(root).toHaveClass('xl:gap-6');
  });

  it('keeps editor and preview width classes from clipping foreground content', () => {
    const { container } = render(<GeneratorClient />);
    const root = container.firstElementChild as HTMLElement;
    const [editorColumn, previewColumn] = Array.from(root.children);

    expect(editorColumn).toHaveClass('w-full');
    expect(editorColumn).toHaveClass('lg:w-[44%]');
    expect(editorColumn).toHaveClass('xl:w-[42%]');
    expect(editorColumn).toHaveClass('flex-shrink-0');

    expect(previewColumn).toHaveClass('w-full');
    expect(previewColumn).toHaveClass('lg:flex-1');
  });

  it('uses dark and light contrast utility classes in rendered child surfaces', () => {
    render(<GeneratorClient />);

    expect(screen.getByTestId('editor-panel')).toHaveClass('bg-white');
    expect(screen.getByTestId('editor-panel')).toHaveClass('text-zinc-950');
    expect(screen.getByTestId('editor-panel')).toHaveClass('dark:bg-zinc-950');
    expect(screen.getByTestId('editor-panel')).toHaveClass('dark:text-zinc-50');

    expect(screen.getByTestId('preview-panel')).toHaveClass('bg-zinc-50');
    expect(screen.getByTestId('preview-panel')).toHaveClass('text-zinc-950');
    expect(screen.getByTestId('preview-panel')).toHaveClass('dark:bg-zinc-950');
    expect(screen.getByTestId('preview-panel')).toHaveClass('dark:text-zinc-50');
  });
});
